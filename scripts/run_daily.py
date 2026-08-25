"""
매일 실행되는 전체 파이프라인의 진입점.
generate_script -> tts -> build_video -> thumbnail -> (선택) upload_youtube 순서로 실행한다.

환경변수:
  DRY_RUN=1  이면 마지막 업로드 단계를 건너뛴다 (영상 생성까지만 테스트할 때 사용).
"""
import os
import subprocess
import sys

STEPS = [
    ("대본 생성", "scripts/generate_script.py"),
    ("음성 합성 (TTS)", "scripts/tts.py"),
    ("영상 합성", "scripts/build_video.py"),
    ("썸네일 생성", "scripts/thumbnail.py"),
]

UPLOAD_STEP = ("유튜브 업로드", "scripts/upload_youtube.py")


def run_step(name: str, path: str):
    print(f"\n===== [{name}] {path} =====")
    # config.py 등 저장소 루트 모듈을 각 하위 스크립트가 import 할 수 있도록 PYTHONPATH를 보장한다.
    repo_root = os.getcwd()
    env = {**os.environ, "PYTHONPATH": repo_root + os.pathsep + os.environ.get("PYTHONPATH", "")}
    result = subprocess.run([sys.executable, path], env=env)
    if result.returncode != 0:
        print(f"\n[run_daily] '{name}' 단계 실패 (exit={result.returncode}). 파이프라인을 중단합니다.")
        sys.exit(result.returncode)


def main():
    for name, path in STEPS:
        run_step(name, path)

    if os.environ.get("DRY_RUN") == "1":
        print("\n[run_daily] DRY_RUN=1 이므로 업로드 단계를 건너뜁니다. output/video.mp4 를 확인하세요.")
        return

    run_step(*UPLOAD_STEP)
    print("\n[run_daily] 완료.")


if __name__ == "__main__":
    main()
