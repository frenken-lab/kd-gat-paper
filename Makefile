.PHONY: data validate figures tables site dev tmlr tmlr-anon preview deploy sync bib all clean

SYNC := python ~/KD-GAT/scripts/data/paper_sync.py

data:
	$(SYNC) pull --schema data/schemas.yaml

validate:
	$(SYNC) validate --schema data/schemas.yaml

figures: data
	cd interactive && npm run build

tables: data
	python scripts/tables/build.py

site: figures tables
	myst build --site

dev:
	myst start

tmlr: site
	python scripts/tmlr/build.py --output submission_folder/

tmlr-anon: site
	python scripts/tmlr/build.py --output submission_folder/ --anonymous

# Merge submission into TMLR author kit and preview with Docker
preview: tmlr
	cp submission_folder/submission.md tmlr_do_not_modify/_under_review/submission.md
	cp -r submission_folder/assets/* tmlr_do_not_modify/assets/ 2>/dev/null || true
	cd tmlr_do_not_modify && bash ./bin/docker_run.sh

deploy: tmlr
	cp submission_folder/submission.md tmlr_do_not_modify/_under_review/submission.md
	cp -r submission_folder/assets/* tmlr_do_not_modify/assets/ 2>/dev/null || true
	@echo "Push to main to deploy via GitHub Pages"

sync:
	npx curvenote pull
	@echo "Review changes with: git diff"

bib:
	python scripts/validate_bib.py

all: site

clean:
	rm -rf _build submission_folder submission_anon figures/*.html
	find data/tables -name '*.md' -delete 2>/dev/null || true
