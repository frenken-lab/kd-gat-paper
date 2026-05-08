#!/bin/bash
# Pull HF data (graphids-kd-gat metrics + graphids-data figures) and write to repo.
# Usage: sbatch tools/pull_data.sbatch [--skip-metrics | --skip-figures | --dry-run]
#SBATCH --job-name=kd-gat-pull-data
#SBATCH --cluster=pitzer
#SBATCH --account=PAS1266
#SBATCH --partition=cpu
#SBATCH --nodes=1
#SBATCH --ntasks=1
#SBATCH --cpus-per-task=2
#SBATCH --mem=16G
#SBATCH --time=00:45:00
#SBATCH --chdir=/users/PAS2022/rf15/kd-gat-paper
#SBATCH --output=%x.%j.log

set -euo pipefail
export PYTHONUNBUFFERED=1

# Pick up HF_TOKEN (and any other secrets) from ~/.env.local if present
[[ -f "$HOME/.env.local" ]] && set -a && source "$HOME/.env.local" && set +a

REPO_ROOT="$PWD"
UV="$HOME/.local/bin/uv"

echo "=== kd-gat pull_data ==="
echo "repo: $REPO_ROOT"
echo "node: $(hostname)"
echo "args: ${*:-<none>}"
echo "========================"

"$UV" run python tools/pull_data.py "$@"

echo "=== done ==="
