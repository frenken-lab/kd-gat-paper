.PHONY: build data validate validate-inputs validate-gsn gsn gsn-render gsn-figure-data figures tables render dev bib test all clean watch-tables pre-commit pre-commit-install slides slides-dev speceditor marimo help

.DEFAULT_GOAL := help

# Quarto picks up the Python kernel from $QUARTO_PYTHON; point it at the uv venv
# so the results chapter executes in this project's environment, not a random
# Python on PATH.
export QUARTO_PYTHON := $(CURDIR)/.venv/bin/python

help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: make \033[36m<target>\033[0m\n"} /^[a-zA-Z_0-9-]+:.*?##/ { printf "  \033[36m%-22s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) }' $(MAKEFILE_LIST)

##@ Data & Validation

data: ## Pull metrics + analysis artifacts + validate
	uv run python tools/pull_data.py

validate: validate-inputs validate-gsn ## Run all validation layers (CI + pre-commit entry point)

validate-inputs: bib ## Layer 1: schema + bib structure
	uv run python tools/validate_inputs.py --data-only

validate-gsn gsn: ## Layer 2: GSN safety argument schema + gap inventory (gsn is an alias)
	uv run python tools/gsn/walker.py

gsn-render: ## Convert gsn-dag.yaml → gsn-flow.json for inspection/commit
	uv run python tools/gsn/render.py

gsn-figure-data: data/gsn/gsn-dag.yaml tools/gsn/render.py
	uv run python tools/gsn/render.py --output interactive/src/figures/diagrams/gsn-thesis/data.json

bib: ## Validate bibliography files only
	uv run python tools/validate_inputs.py --bib-only

##@ Build

build: ## Unified build: data → figures → tables → slides → site
	uv run python tools/build.py build

figures: data gsn-figure-data ## Build all interactive figures → _build/figures/  (FIGURE=name  FORCE=1)
	uv run python tools/build.py figures

tables: data ## Build markdown tables → _build/tables/
	uv run python tools/build.py tables

render: build ## Full site build (alias for build)

dev: ## Quarto live-reload preview server
	quarto preview

watch-tables: ## Watch data/csv + specs, rebuild tables on change — requires entr
	@command -v entr >/dev/null 2>&1 || { echo "entr not found. Install: https://eradman.com/entrproject/"; exit 1; }
	@echo "Watching data/csv, schemas.yaml, tools/tables/spec.yaml..."
	@find data/csv data/schemas.yaml tools/tables/spec.yaml | entr -r make tables

slides: tables ## Build colloquium slides → _build/slides/
	uv run python tools/build.py slides

slides-dev: ## Colloquium live-reload server for slides (port 8080)
	@echo "Slides → http://localhost:8080/candidacy.html"
	uv run python tools/slides/serve.py presentations/candidacy.md --port 8080

speceditor: ## Build spec editor widget
	cd interactive && bun run build:widget

marimo: ## Open the marimo insight workspace (requires marimo)
	uv run marimo edit analysis/marimo

all: build ## Full pipeline: data → figures → tables → slides → site

##@ Meta

test: ## Run interactive figure tests (vitest in interactive/)
	cd interactive && bun run test

pre-commit: ## Run pre-commit hooks on all files
	pre-commit run --all-files

pre-commit-install: ## Install pre-commit hooks
	uv tool install pre-commit && pre-commit install

clean: ## Remove _build/
	rm -rf _build
