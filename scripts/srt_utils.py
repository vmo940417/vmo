"""edge-tts가 만든 단어 단위 SRT를 파싱하고, 화면에 읽기 좋은 줄 단위 자막으로 재구성한다."""
import re
from dataclasses import dataclass

_TIME_RE = re.compile(
    r"(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})"
)


@dataclass
class Cue:
    start: float  # seconds
    end: float
    text: str


def _to_seconds(h, m, s, ms) -> float:
    return int(h) * 3600 + int(m) * 60 + int(s) + int(ms) / 1000.0


def parse_srt(srt_text: str) -> list[Cue]:
    cues = []
    blocks = re.split(r"\n\s*\n", srt_text.strip())
    for block in blocks:
        lines = block.strip().splitlines()
        if len(lines) < 2:
            continue
        m = _TIME_RE.search(lines[1]) if not _TIME_RE.search(lines[0]) else _TIME_RE.search(lines[0])
        # 첫 줄이 인덱스 번호가 아닐 수도 있으니 두 줄 다 검사
        time_line_idx = 0 if _TIME_RE.search(lines[0]) else 1
        m = _TIME_RE.search(lines[time_line_idx])
        if not m:
            continue
        start = _to_seconds(*m.groups()[0:4])
        end = _to_seconds(*m.groups()[4:8])
        text = " ".join(lines[time_line_idx + 1 :]).strip()
        if text:
            cues.append(Cue(start=start, end=end, text=text))
    return cues


def group_cues(word_cues: list[Cue], max_chars: int = 14) -> list[Cue]:
    """단어 단위 큐를 자연스러운 자막 줄(최대 max_chars자)로 묶는다."""
    if not word_cues:
        return []

    grouped: list[Cue] = []
    buf_words: list[str] = []
    buf_start = word_cues[0].start
    buf_len = 0

    def flush(end_time):
        nonlocal buf_words, buf_len
        if buf_words:
            grouped.append(Cue(start=buf_start, end=end_time, text=" ".join(buf_words)))
        buf_words = []
        buf_len = 0

    for i, cue in enumerate(word_cues):
        candidate_len = buf_len + len(cue.text) + (1 if buf_words else 0)
        ends_sentence = cue.text.endswith((".", "?", "!", "요", "다", "다."))
        if buf_words and candidate_len > max_chars:
            flush(word_cues[i - 1].end)
            buf_start = cue.start
        if not buf_words:
            buf_start = cue.start
        buf_words.append(cue.text)
        buf_len += len(cue.text) + 1
        if ends_sentence and buf_len >= max_chars * 0.6:
            flush(cue.end)
            if i + 1 < len(word_cues):
                buf_start = word_cues[i + 1].start

    flush(word_cues[-1].end)
    return grouped


def _fmt_srt_time(t: float) -> str:
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def write_srt(cues: list[Cue], path: str):
    lines = []
    for i, c in enumerate(cues, start=1):
        lines.append(str(i))
        lines.append(f"{_fmt_srt_time(c.start)} --> {_fmt_srt_time(c.end)}")
        lines.append(c.text)
        lines.append("")
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def _fmt_ass_time(t: float) -> str:
    cs = int(round(t * 100))  # centiseconds
    h, cs = divmod(cs, 360000)
    m, cs = divmod(cs, 6000)
    s, cs = divmod(cs, 100)
    return f"{h:d}:{m:02d}:{s:02d}.{cs:02d}"


def _escape_ass_text(text: str) -> str:
    return text.replace("\\", "/").replace("{", "(").replace("}", ")")


def write_ass(
    cues: list[Cue],
    path: str,
    *,
    play_res_x: int,
    play_res_y: int,
    font_name: str,
    font_size: int,
    margin_v: int,
    margin_lr: int,
    outline: int = 5,
):
    """자막을 .ass 파일로 직접 작성한다.

    ffmpeg의 subtitles 필터에 일반 .srt + force_style을 넘기면, libass가 내부적으로
    가정하는 기본 스크립트 해상도(전통적으로 384x288)를 기준으로 스타일 값을 해석하고
    이를 실제 출력 해상도에 맞춰 자동으로 배율 조정한다. 그 결과 FontSize/MarginV 같은
    값이 의도치 않게 6~7배 확대되어 자막이 화면 밖으로 밀려나는 문제가 생길 수 있다.
    PlayResX/PlayResY를 실제 영상 해상도와 동일하게 명시한 .ass 파일을 직접 생성하면
    배율이 1:1이 되어 이 문제를 원천적으로 피할 수 있다.
    """
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: {play_res_x}
PlayResY: {play_res_y}
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,{font_name},{font_size},&H00FFFFFF,&H000000FF,&H00000000,&H00000000,-1,0,0,0,100,100,0,0,1,{outline},0,2,{margin_lr},{margin_lr},{margin_v},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for c in cues:
        text = _escape_ass_text(c.text)
        lines.append(
            f"Dialogue: 0,{_fmt_ass_time(c.start)},{_fmt_ass_time(c.end)},Default,,0,0,0,,{text}\n"
        )
    with open(path, "w", encoding="utf-8") as f:
        f.write("".join(lines))
