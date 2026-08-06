package com.vmo.stockwhy

import android.annotation.SuppressLint
import android.content.Context
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject
import java.io.BufferedReader
import java.net.HttpURLConnection
import java.net.URL
import java.util.zip.GZIPInputStream

/**
 * 앱은 WebView 한 장이고, 네이티브가 하는 일은 HTTP 요청 대행뿐이다.
 *
 * 브라우저에서 네이버를 직접 못 부르는 건 CORS 때문인데, 네이티브 HTTP 에는 그
 * 제약이 없다. 그래서 통신만 Kotlin 이 맡고 화면과 분석 로직은 전부 JS 에 둔다 —
 * 이 파일을 실기기에서 검증하지 못하는 만큼, 네이티브 쪽 표면적을 최소로 줄이는 게
 * 안전하다.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        web = WebView(this).apply {
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true        // localStorage (설정 저장)
            settings.textZoom = 100                  // 시스템 글꼴 크기에 레이아웃이 깨지지 않게
            addJavascriptInterface(Bridge(this@MainActivity), "Native")
            loadUrl("file:///android_asset/index.html")
        }
        setContentView(web)

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })
    }

    override fun onDestroy() {
        web.destroy()
        super.onDestroy()
    }
}

/**
 * JS 에서 `Native.httpGet(...)` 으로 부른다.
 *
 * @JavascriptInterface 메서드는 UI 스레드가 아닌 전용 JavaBridge 스레드에서 실행되므로
 * 여기서 블로킹 네트워크를 해도 화면이 멈추지 않는다.
 */
class Bridge(private val ctx: Context) {

    @JavascriptInterface
    fun httpGet(url: String, headersJson: String): String =
        request("GET", url, headersJson, null)

    @JavascriptInterface
    fun httpPost(url: String, headersJson: String, body: String): String =
        request("POST", url, headersJson, body)

    /** 설정 저장 — API 키처럼 앱을 지워도 남으면 안 되는 값. */
    @JavascriptInterface
    fun getPref(key: String): String =
        prefs().getString(key, "") ?: ""

    @JavascriptInterface
    fun setPref(key: String, value: String) {
        prefs().edit().putString(key, value).apply()
    }

    private fun prefs() = ctx.getSharedPreferences("stockwhy", Context.MODE_PRIVATE)

    private fun request(method: String, url: String, headersJson: String, body: String?): String {
        var conn: HttpURLConnection? = null
        return try {
            conn = (URL(url).openConnection() as HttpURLConnection).apply {
                requestMethod = method
                connectTimeout = 15_000
                readTimeout = 90_000        // LLM 응답은 수십 초 걸릴 수 있다
                instanceFollowRedirects = true
                setRequestProperty("User-Agent", UA)
                setRequestProperty("Accept-Encoding", "gzip")
            }

            val headers = JSONObject(headersJson)
            for (name in headers.keys()) {
                conn.setRequestProperty(name, headers.getString(name))
            }

            if (body != null) {
                conn.doOutput = true
                conn.outputStream.use { it.write(body.toByteArray(Charsets.UTF_8)) }
            }

            val status = conn.responseCode
            val stream = if (status in 200..299) conn.inputStream else conn.errorStream
            val text = stream?.let { raw ->
                val decoded = if (conn.contentEncoding?.contains("gzip", true) == true) {
                    GZIPInputStream(raw)
                } else raw
                decoded.bufferedReader(Charsets.UTF_8).use(BufferedReader::readText)
            } ?: ""

            JSONObject()
                .put("ok", status in 200..299)
                .put("status", status)
                .put("body", text)
                .toString()
        } catch (e: Exception) {
            // 통신 실패가 앱을 죽이면 안 된다. JS 가 읽고 화면에 사유를 띄운다.
            JSONObject()
                .put("ok", false)
                .put("status", 0)
                .put("error", "${e.javaClass.simpleName}: ${e.message}")
                .toString()
        } finally {
            conn?.disconnect()
        }
    }

    companion object {
        private const val UA =
            "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) " +
                "Chrome/120.0 Mobile Safari/537.36"
    }
}
