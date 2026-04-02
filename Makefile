.PHONY: data validate figures figures-static tables site dev tmlr tmlr-anon preview deploy sync bib all clean

SYNC := python ~/KD-GAT/scripts/data/paper_sync.py

data:
	$(SYNC) pull --schema data/schemas.yaml

validate:
	$(SYNC) validate --schema data/schemas.yaml

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
