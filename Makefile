.PHONY: data validate validate-inputs validate-semantic figures tables site dev dev-myst candidacy-site candidacy-dev candidacy-pdf tmlr tmlr-anon preview deploy sync bib test all clean watch-tables pre-commit pre-commit-install lint lint-sync

data:
	uv run python tools/pull_data.py

# Layer 1 — input contract: schemas + bib structure.
validate-inputs: bib
	uv run python tools/validate/inputs/data.py

# Layer 2 — semantic contract over _build/site/content/*.json (cross-refs + citations).
# Requires _build/site/ to exist; run `make site` first if it doesn't.
# See tools/validate/README.md and AUTHORING.md.
validate-semantic:
	cd tools/validate && bun install --silent && bun lint.mjs

# Meta: run all validation layers. Single entry point for CI + pre-commit.
validate: validate-inputs validate-semantic

# FIGURE=name builds only one figure. FORCE=1 bypasses the mtime cache.
figures: data
	cd interactive && bun install && FIGURE="$(FIGURE)" FORCE="$(FORCE)" bun run build

tables: data
	uv run python tools/tables/build.py

site: figures tables
	myst build --site

# Orchestrated dev: myst + vite (figures) + entr-driven table rebuild.
# Requires `overmind` (https://github.com/DarthSim/overmind) and `entr`.
# `make dev-myst` runs only myst (no figure HMR, no table watcher).
dev:
	@command -v overmind >/dev/null 2>&1 || { echo "overmind not found. Install: go install github.com/DarthSim/overmind/v2@latest (binary lands in ~/go/bin) — or use mprocs if you prefer Rust"; exit 1; }
	@command -v entr >/dev/null 2>&1 || { echo "entr not found. Install: https://eradman.com/entrproject/"; exit 1; }
	overmind start -f Procfile.dev

dev-myst:
	myst start

candidacy-site: figures tables
	myst build --site --config myst.candidacy.yml

candidacy-dev:
	myst start --config myst.candidacy.yml

candidacy-pdf: figures tables
	myst build --pdf --config myst.candidacy.yml

tmlr: site
	cd tools/tmlr && bun install --silent && bun build.mjs --output ../../_build/submission/

tmlr-anon: site
	cd tools/tmlr && bun install --silent && bun build.mjs --output ../../_build/submission/ --anonymous

# Merge submission into TMLR author kit and preview with Docker
preview: tmlr
	cp _build/submission/submission.md tmlr_do_not_modify/_under_review/submission.md
	cp -r _build/submission/assets/* tmlr_do_not_modify/assets/ 2>/dev/null || true
	cd tmlr_do_not_modify && bash ./bin/docker_run.sh

deploy: tmlr
	cp _build/submission/submission.md tmlr_do_not_modify/_under_review/submission.md
	cp -r _build/submission/assets/* tmlr_do_not_modify/assets/ 2>/dev/null || true
	@echo "Push to main to deploy via GitHub Pages"

sync:
	bunx curvenote pull
	@echo "Review changes with: git diff"

bib:
	uv run python tools/validate/inputs/bib.py

test:
	cd tools/tmlr && bun test

all: site

clean:
	rm -rf _build

# Live rebuild of tables when data/specs change (requires `entr`).
watch-tables:
	@command -v entr >/dev/null 2>&1 || { echo "entr not found. Install: https://eradman.com/entrproject/"; exit 1; }
	@echo "Watching data/csv, schemas.yaml, tools/tables/spec.yaml..."
	@find data/csv data/schemas.yaml tools/tables/spec.yaml | entr -r make tables

pre-commit-install:
	uv tool install pre-commit && pre-commit install

pre-commit:
	pre-commit run --all-files

# Prose lint — Vale + MLPaper rules (STYLE.md §3 R4 + §4 B1-B8) + proselint + write-good.
# Install Vale: https://vale.sh/docs/install (binary; brew/scoop/apt). First run needs `make lint-sync`.
lint:
	@command -v vale >/dev/null 2>&1 || { echo "vale not found. Install: https://vale.sh/docs/install"; exit 1; }
	vale paper/content/ paper/candidacy/

lint-sync:
	@command -v vale >/dev/null 2>&1 || { echo "vale not found. Install: https://vale.sh/docs/install"; exit 1; }
	vale sync
