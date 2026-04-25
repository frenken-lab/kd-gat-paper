.PHONY: data validate figures figures-static tables site dev candidacy-site candidacy-dev candidacy-pdf tmlr tmlr-anon preview deploy sync bib test all clean watch-tables pre-commit pre-commit-install

data:
	uv run python tools/pull_data.py

validate:
	uv run python tools/validate_data.py

# FIGURE=name builds only one figure. FORCE=1 bypasses the mtime cache.
figures: data
	cd interactive && npm i && FIGURE="$(FIGURE)" FORCE="$(FORCE)" npm run build

figures-static: figures
	node tools/pdf/extract-svg.js

tables: data
	uv run python tools/tables/build.py

site: figures tables
	myst build --site

dev:
	myst start

candidacy-site: figures tables
	myst build --site --config myst.candidacy.yml

candidacy-dev:
	myst start --config myst.candidacy.yml

candidacy-pdf: figures tables
	myst build --pdf --config myst.candidacy.yml

tmlr: site
	uv run python tools/tmlr/build.py --output _build/submission/

tmlr-anon: site
	uv run python tools/tmlr/build.py --output _build/submission/ --anonymous

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
	npx curvenote pull
	@echo "Review changes with: git diff"

bib:
	uv run python tools/validate_bib.py

test:
	uv run python -m pytest tests/ -v

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
