#!/usr/bin/env bash
# Runs every GUT test headless (no window). Usage: ./run_tests.sh   (from the game/ folder)
# Needs Godot 4.6 on the PATH as "godot" (or set GODOT=/path/to/godot).
set -euo pipefail
cd "$(dirname "$0")"
GODOT="${GODOT:-godot}"
"$GODOT" --headless --path . --import >/dev/null 2>&1 || true   # make sure data/ and audio/ are imported
"$GODOT" --headless --path . -s addons/gut/gut_cmdln.gd -gconfig=res://.gutconfig.json "$@"
