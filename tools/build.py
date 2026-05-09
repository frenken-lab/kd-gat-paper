#!/usr/bin/env python3
"""Unified build entry point for the repo.

This hides the Bun/Vite/Quarto/Python split behind one command.

Usage:
    uv run python tools/build.py validate
    uv run python tools/build.py build
    uv run python tools/build.py data
    uv run python tools/build.py figures
    uv run python tools/build.py tables
    uv run python tools/build.py slides
    uv run python tools/build.py site
"""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTERACTIVE = ROOT / "interactive"


def run(cmd: list[str], *, cwd: Path | None = None, env: dict[str, str] | None = None) -> None:
    print(f"$ {' '.join(cmd)}")
    subprocess.run(cmd, cwd=cwd or ROOT, env=env, check=True)


def copy_tree(pattern: str, dest: Path) -> None:
    dest.mkdir(parents=True, exist_ok=True)
    for src in sorted(ROOT.glob(pattern)):
        if src.is_file():
            shutil.copy2(src, dest / src.name)


def phase_data(*, skip_validation: bool = False) -> None:
    cmd = [sys.executable, "tools/pull_data.py"]
    if skip_validation:
        cmd.append("--skip-validation")
    run(cmd)


def phase_validate_all() -> None:
    run([sys.executable, "tools/validate_inputs.py"])
    run([sys.executable, "tools/gsn/walker.py"])


def phase_validate_gate() -> None:
    run([sys.executable, "tools/validate_inputs.py", "--bib-only"])
    run([sys.executable, "tools/gsn/walker.py"])


def phase_figures() -> None:
    run(["bun", "install", "--frozen-lockfile"], cwd=INTERACTIVE)
    run(["bun", "run", "build"], cwd=INTERACTIVE)


def phase_tables() -> None:
    run([sys.executable, "tools/tables/build.py"])


def phase_slides() -> None:
    run([sys.executable, "tools/slides/build.py", "presentations/candidacy.md", "_build/slides"])
    copy_tree("presentations/*.svg", ROOT / "_build/slides")
    copy_tree("images/*.svg", ROOT / "_build/slides")


def phase_site() -> None:
    env = os.environ.copy()
    env["QUARTO_PYTHON"] = str(ROOT / ".venv" / "bin" / "python")
    run(["quarto", "render"], env=env)
    copy_tree("_build/figures/*.html", ROOT / "_build/site/assets/html/submission")
    copy_tree("_build/slides/candidacy.html", ROOT / "_build/site/slides")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "command",
        choices=["validate", "data", "figures", "tables", "slides", "site", "build"],
        help="Build phase to run",
    )
    args = parser.parse_args()

    if args.command == "validate":
        phase_validate_all()
    elif args.command == "data":
        phase_data()
    elif args.command == "figures":
        phase_figures()
    elif args.command == "tables":
        phase_tables()
    elif args.command == "slides":
        phase_slides()
    elif args.command == "site":
        phase_site()
    elif args.command == "build":
        phase_validate_gate()
        phase_data(skip_validation=True)
        phase_figures()
        phase_tables()
        phase_slides()
        phase_site()


if __name__ == "__main__":
    main()
