#!/usr/bin/env bash
# Build TikZ diagrams → PDF → SVG
# Requires: pdflatex (module load texlive on OSC), pdf2svg
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
TIKZ_DIR="$REPO_ROOT/tikz"
OUT_DIR="$REPO_ROOT/figures"

mkdir -p "$OUT_DIR"

if ! command -v pdflatex &>/dev/null; then
    echo "ERROR: pdflatex not found. On OSC: module load texlive" >&2
    exit 1
fi

for f in "$TIKZ_DIR"/*.tikz; do
    [ -f "$f" ] || continue
    base="$(basename "$f" .tikz)"
    echo "Building: $base"

    # Compile TikZ → PDF (wrap in standalone document class)
    cat > "$TIKZ_DIR/${base}_wrapper.tex" <<EOF
\\documentclass[tikz,border=10pt]{standalone}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta,positioning,shapes.geometric,fit,backgrounds,calc}
\\usepackage{amsmath,amssymb}
\\begin{document}
\\input{${base}.tikz}
\\end{document}
EOF

    pdflatex -interaction=nonstopmode -output-directory="$TIKZ_DIR" "$TIKZ_DIR/${base}_wrapper.tex" >/dev/null 2>&1

    if [ -f "$TIKZ_DIR/${base}_wrapper.pdf" ]; then
        if command -v pdf2svg &>/dev/null; then
            pdf2svg "$TIKZ_DIR/${base}_wrapper.pdf" "$OUT_DIR/${base}.svg"
            echo "  → $OUT_DIR/${base}.svg"
        else
            cp "$TIKZ_DIR/${base}_wrapper.pdf" "$OUT_DIR/${base}.pdf"
            echo "  → $OUT_DIR/${base}.pdf (pdf2svg not available)"
        fi
    else
        echo "  ERROR: pdflatex failed for $base" >&2
    fi

    # Clean auxiliary files
    rm -f "$TIKZ_DIR/${base}_wrapper".{tex,aux,log,pdf}
done

echo "Done"
