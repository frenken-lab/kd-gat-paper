.PHONY: data validate figures figures-static tables site dev candidacy-site candidacy-dev candidacy-pdf tmlr tmlr-anon preview deploy sync bib all clean

data:
	uv run --with huggingface_hub --with pandas --with pyarrow --with pyyaml python data/pull_data.py

validate:
	python data/validate.py

figures: data
	cd interactive && npm run build

figures-static: figures
	node export/pdf/extract-svg.js

tables: data
	python data/tables/build.py

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
	python export/tmlr/build.py --output _build/submission/

tmlr-anon: site
	python export/tmlr/build.py --output _build/submission/ --anonymous

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
	python references/validate.py

all: site

clean:
	rm -rf _build
