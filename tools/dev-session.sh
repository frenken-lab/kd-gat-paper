#!/usr/bin/env bash
# dev-session.sh — Bootstrap paper development environment
#
# Run from VS Code terminal or SSH:
#   bash dev-session.sh
#
# Creates a tmux session "paper" with 3 windows:
#   1. myst start (paper preview on :3000)
#   2. vite dev (figure HMR on :5173)
#   3. shell (for make, git, pull_data, etc.)
#
# If the session already exists, attaches to it.
set -euo pipefail

SESSION="paper"
REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"

# Ensure node modules are installed
if [ ! -d "$REPO_ROOT/interactive/node_modules" ]; then
    echo "Installing node dependencies..."
    (cd "$REPO_ROOT/interactive" && npm install)
fi

# Load OSC modules if available
if command -v module &>/dev/null; then
    module load node-js/22.12.0 2>/dev/null || true
fi

# Source env vars
[ -f ~/.env.local ] && source ~/.env.local

# If session exists, attach
if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Session '$SESSION' already running. Attaching..."
    tmux attach -t "$SESSION"
    exit 0
fi

echo "Starting paper dev session..."

# Window 1: MyST paper preview
tmux new-session -d -s "$SESSION" -n "paper" -c "$REPO_ROOT"
tmux send-keys -t "$SESSION:paper" "myst start" Enter

# Window 2: Vite figure dev server
tmux new-window -t "$SESSION" -n "figures" -c "$REPO_ROOT/interactive"
tmux send-keys -t "$SESSION:figures" "npm run dev -- --port 5173" Enter

# Window 3: Working shell
tmux new-window -t "$SESSION" -n "shell" -c "$REPO_ROOT"
tmux send-keys -t "$SESSION:shell" "echo 'Paper: http://localhost:3000  Figures: http://localhost:5173'" Enter

# Window 4: Tables auto-rebuild on data/spec change (degrades gracefully without entr)
tmux new-window -t "$SESSION" -n "tables" -c "$REPO_ROOT"
if command -v entr &>/dev/null; then
    tmux send-keys -t "$SESSION:tables" \
        "find data/csv data/schemas.yaml tools/tables/spec.yaml | entr -r make tables" Enter
else
    tmux send-keys -t "$SESSION:tables" \
        "echo 'entr not installed — tables will not auto-rebuild. Run: make tables'" Enter
fi

# Focus on shell window
tmux select-window -t "$SESSION:shell"

echo ""
echo "Dev session ready:"
echo "  Paper preview:  http://localhost:3000"
echo "  Figure HMR:     http://localhost:5173"
echo "  tmux session:   $SESSION (4 windows: paper, figures, shell, tables)"
echo ""
echo "VS Code: Ctrl+Shift+P → 'Simple Browser: Show' → localhost:3000"
echo ""

# Attach if running interactively, otherwise print instructions
if [ -t 0 ]; then
    tmux attach -t "$SESSION"
else
    echo "Run 'tmux attach -t $SESSION' to connect."
fi
