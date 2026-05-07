.PHONY: data validate validate-inputs validate-semantic figures tables site dev dev-myst candidacy-site candidacy-dev candidacy-astro tmlr tmlr-anon preview deploy sync sync-editor bib test all clean watch-tables pre-commit pre-commit-install lint-editor slides

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

# Bundled stylesheet for the candidacy site. book-theme's `style:` option
# only takes one file; we concat our two source CSS files into a single
# bundle so curvenote/scms picks them up.
_static/site.bundle.css: _static/custom.css _static/story.css
	cat $^ > $@

candidacy-site: figures tables _static/site.bundle.css
	myst build --site --config myst.candidacy.yml

candidacy-dev:
	myst start --config myst.candidacy.yml

# Self-hosted Astro build of the candidacy site. Reads _build/site/ produced
# by candidacy-site and emits flat HTML to _build/astro/. See tools/site/README.md.
candidacy-astro: candidacy-site
	cd tools/site && bun install --silent && bun run build

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

# Pull editor changes from curvenote.com into the repo. DESTRUCTIVE — overwrites
# files in paper/from-editor/ with whatever's on curvenote.com. Aborts if working
# tree is dirty.
#
# Runs from inside paper/from-editor/, which has its own curvenote.yml (with
# id + remote). Do NOT run curvenote work push / clone / pull from the repo
# root — bunx writes back to the loaded myst.yml AND to myst.candidacy.yml,
# stripping committee/exports blocks. See memory project_curvenote_cli_writeback.
sync:
	@if [ ! -f paper/from-editor/curvenote.yml ]; then \
	  echo "ERROR: paper/from-editor/curvenote.yml not present."; \
	  echo "       Create a Project at https://editor.curvenote.com/@<user>/<slug>,"; \
	  echo "       then \`bunx -y curvenote@0.14.3 clone <project-url> paper/from-editor/\`."; \
	  exit 1; \
	fi
	@if ! git diff --quiet || ! git diff --cached --quiet; then \
	  echo "ERROR: working tree has uncommitted changes."; \
	  echo "       curvenote pull overwrites local files. Commit or stash first."; \
	  exit 1; \
	fi
	cd paper/from-editor && bunx -y curvenote@0.14.3 pull --yes
	@echo "Done. Review changes with: git diff paper/from-editor/"

# Push the candidacy as 7 Articles (one per TOC section) to the curvenote.com
# editor Project via api.curvenote.com. Idempotent: reuses named blocks and
# deletes stale ones from prior builds.
#
# CURVENOTE_TOKEN must be exported (we source ~/.env.local before running).
sync-editor: lint-editor
	@if [ ! -f paper/from-editor/curvenote.yml ]; then \
	  echo "ERROR: paper/from-editor/curvenote.yml not present (clone the curvenote.com Project first)."; \
	  exit 1; \
	fi
	@if [ -z "$$CURVENOTE_TOKEN" ] && [ -f $$HOME/.env.local ]; then \
	  set -a; . $$HOME/.env.local; set +a; \
	fi; \
	cd tools/curvenote && bun install --silent && cd - >/dev/null; \
	bun tools/curvenote/buildv2.mjs

# Lint: check that all table/figure/iframe directives in the candidacy source
# have +++ {"type":"..."} wrappers. Without them the editor silently drops them.
lint-editor:
	cd tools/curvenote && bun install --silent && cd - >/dev/null
	bun tools/curvenote/buildv2.mjs --lint

slides:
	uv run python tools/slides/build.py presentations/candidacy.md _build/slides

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
