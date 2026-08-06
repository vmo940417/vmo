plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.vmo.stockwhy"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.vmo.stockwhy"
        minSdk = 26
        targetSdk = 35

        // 빌드마다 올라가야 안드로이드가 '업데이트'로 인식한다.
        // CI 에서는 실행 번호를, 로컬 빌드에서는 1 을 쓴다.
        val build = (System.getenv("GITHUB_RUN_NUMBER") ?: "1").toInt()
        versionCode = build
        versionName = "1.$build"
    }

    signingConfigs {
        // 고정 키로 서명한다. 기본 디버그 키는 빌드 머신마다 새로 만들어지는데,
        // 안드로이드는 서명이 다른 APK 를 기존 앱 위에 덮어쓰지 못하게 막는다.
        // CI 가 매번 새 키를 만들면 업데이트할 때마다 앱을 지웠다 깔아야 한다.
        //
        // 이 키는 비밀이 아니다(저장소에 그대로 들어 있다). 여기서 필요한 건
        // 기밀성이 아니라 '매번 같을 것'뿐이다. Play 스토어에 올릴 키가 아니므로
        // 이 절충은 의도된 것이다.
        getByName("debug") {
            storeFile = rootProject.file("keystore/stockwhy.jks")
            storePassword = "stockwhy"
            keyAlias = "stockwhy"
            keyPassword = "stockwhy"
        }
    }

    buildTypes {
        // 디버그 빌드만 내보낸다 — 사이드로드로 설치하는 앱이라 이걸로 충분하다.
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.webkit:webkit:1.12.1")
}
