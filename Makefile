.PHONY: data validate validate-inputs validate-semantic validate-gsn gsn gsn-render gsn-figure-data figures tables site dev dev-myst candidacy-site candidacy-dev tmlr tmlr-anon preview deploy sync sync-editor bib test all clean watch-tables pre-commit pre-commit-install lint-editor slides speceditor help

.DEFAULT_GOAL := help

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Data & Validation

data: ## Pull from buckeyeguy/GraphIDS (HF) + validate against schemas.yaml
	uv run python tools/pull_data.py

validate: validate-inputs validate-semantic validate-gsn ## Run all validation layers (CI + pre-commit entry point)

validate-inputs: bib ## Layer 1: schema + bib structure
	uv run python tools/validate/inputs/data.py

validate-semantic: ## Layer 2: AST cross-refs + citations (requires make site first)
	cd tools/validate && bun install --silent && bun lint.mjs

validate-gsn gsn: ## Layer 3: GSN safety argument schema + gap inventory (gsn is an alias)
	uv run python tools/gsn/walker.py

gsn-render: ## Convert gsn-dag.yaml → gsn-flow.json for inspection/commit
	uv run python tools/gsn/render.py

gsn-figure-data: data/gsn/gsn-dag.yaml tools/gsn/render.py
	uv run python tools/gsn/render.py --output interactive/src/figures/diagrams/gsn-thesis/data.json

bib: ## Validate bibliography files only
	uv run python tools/validate/inputs/bib.py

##@ Dev

dev: ## Full dev loop: myst + vite (figures HMR) + table watcher — requires overmind + entr
	@command -v overmind >/dev/null 2>&1 || { echo "overmind not found. Install: go install github.com/DarthSim/overmind/v2@latest (binary lands in ~/go/bin) — or use mprocs if you prefer Rust"; exit 1; }
	@command -v entr >/dev/null 2>&1 || { echo "entr not found. Install: https://eradman.com/entrproject/"; exit 1; }
	overmind start -f Procfile.dev

dev-myst: ## MyST dev server, paper config — clears site cache on start
	rm -rf _build/site _build/html
	myst start

candidacy-dev: ## MyST dev server, candidacy config — clears site cache on start
	rm -rf _build/site _build/html
	myst start --config myst.candidacy.yml

watch-tables: ## Watch data/csv + specs, rebuild tables on change — requires entr
	@command -v entr >/dev/null 2>&1 || { echo "entr not found. Install: https://eradman.com/entrproject/"; exit 1; }
	@echo "Watching data/csv, schemas.yaml, tools/tables/spec.yaml..."
	@find data/csv data/schemas.yaml tools/tables/spec.yaml | entr -r make tables

##@ Build

figures: data gsn-figure-data ## Build all interactive figures → _build/figures/  (FIGURE=name  FORCE=1)
	cd interactive && bun install && FIGURE="$(FIGURE)" FORCE="$(FORCE)" bun run build

tables: data ## Build markdown tables → _build/tables/
	uv run python tools/tables/build.py

site: figures tables ## Full site build: figures → tables → myst build
	myst build --site

_static/site.bundle.css: _static/custom.css _static/story.css
	cat $^ > $@

candidacy-site: figures tables _static/site.bundle.css ## Build candidacy site
	myst build --site --config myst.candidacy.yml

slides: ## Build colloquium slides → _build/slides/
	uv run python tools/slides/build.py presentations/candidacy.md _build/slides
	cp presentations/*.svg _build/slides/

slides-dev: ## Colloquium live-reload server for slides (port 8080, no tunnel needed locally)
	@echo "Slides → http://localhost:8080/candidacy.html"
	uv run python tools/slides/serve.py presentations/candidacy.md --port 8080

speceditor: ## Build spec editor widget
	cd interactive && bun run build:widget

all: site ## Full pipeline: data → figures → tables → site

##@ TMLR

tmlr: site ## Build TMLR submission → _build/submission/
	cd tools/tmlr && bun install --silent && bun build.mjs --output ../../_build/submission/

tmlr-anon: site ## Build anonymous TMLR submission
	cd tools/tmlr && bun install --silent && bun build.mjs --output ../../_build/submission/ --anonymous

preview: tmlr ## Build TMLR + Jekyll preview via Docker
	cp _build/submission/submission.md tmlr_do_not_modify/_under_review/submission.md
	cp -r _build/submission/assets/* tmlr_do_not_modify/assets/ 2>/dev/null || true
	cd tmlr_do_not_modify && bash ./bin/docker_run.sh

deploy: tmlr ## Merge submission into TMLR author kit
	cp _build/submission/submission.md tmlr_do_not_modify/_under_review/submission.md
	cp -r _build/submission/assets/* tmlr_do_not_modify/assets/ 2>/dev/null || true
	@echo "Push to main to deploy via GitHub Pages"

##@ Sync

sync: ## Pull Curvenote editor → paper/from-editor/  DESTRUCTIVE — commit/stash first
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

sync-editor: lint-editor ## Push candidacy to Curvenote editor via API (requires CURVENOTE_TOKEN)
	@if [ ! -f paper/from-editor/curvenote.yml ]; then \
	  echo "ERROR: paper/from-editor/curvenote.yml not present (clone the curvenote.com Project first)."; \
	  exit 1; \
	fi
	@if [ -z "$$CURVENOTE_TOKEN" ] && [ -f $$HOME/.env.local ]; then \
	  set -a; . $$HOME/.env.local; set +a; \
	fi; \
	cd tools/curvenote && bun install --silent && cd - >/dev/null; \
	bun tools/curvenote/buildv2.mjs

lint-editor: ## Lint editor directive wrappers before sync-editor
	cd tools/curvenote && bun install --silent && cd - >/dev/null
	bun tools/curvenote/buildv2.mjs --lint

##@ Meta

test: ## Run TMLR serializer tests (bun test)
	cd tools/tmlr && bun test

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

pre-commit-install: ## Install pre-commit hooks
	uv tool install pre-commit && pre-commit install

clean: ## Remove _build/
	rm -rf _build
