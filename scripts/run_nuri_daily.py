"""
'누리의 아침 인사' 시리즈의 전체 파이프라인 진입점.
generate_nuri_script -> tts -> build_nuri_video -> (선택) upload_nuri 순서로 실행한다.

메인 명언 채널의 run_daily.py와 구조는 동일하지만, 완전히 분리된 OUTPUT_DIR/STATE_DIR로
실행되도록 daily-short.yml이 아닌 nuri-morning.yml에서만 호출된다 (서로 절대 섞이지 않음).

환경변수:
  DRY_RUN=1  이면 마지막 업로드 단계를 건너뛴다 (영상 생성까지만 테스트할 때 사용).
"""
import os
import subprocess
import sys

STEPS = [
    ("누리 인사말 선택", "scripts/generate_nuri_script.py"),
    ("음성 합성 (TTS)", "scripts/tts.py"),
    ("영상 합성", "scripts/build_nuri_video.py"),
]

UPLOAD_STEP = ("유튜브 업로드", "scripts/upload_nuri.py")


def run_step(name: str, path: str):
    print(f"\n===== [{name}] {path} =====")
    repo_root = os.getcwd()
    env = {**os.environ, "PYTHONPATH": repo_root + os.pathsep + os.environ.get("PYTHONPATH", "")}
    result = subprocess.run([sys.executable, path], env=env)
    if result.returncode != 0:
        print(f"\n[run_nuri_daily] '{name}' 단계 실패 (exit={result.returncode}). 파이프라인을 중단합니다.")
        sys.exit(result.returncode)


def main():
    for name, path in STEPS:
        run_step(name, path)

    if os.environ.get("DRY_RUN") == "1":
        print(f"\n[run_nuri_daily] DRY_RUN=1 이므로 업로드 단계를 건너뜁니다. {os.environ.get('OUTPUT_DIR', 'output')}/video.mp4 를 확인하세요.")
        return

    run_step(*UPLOAD_STEP)
    print("\n[run_nuri_daily] 완료.")


if __name__ == "__main__":
    main()
