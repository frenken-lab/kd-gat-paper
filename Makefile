.PHONY: data validate figures diagrams tables site dev tmlr tmlr-anon preview deploy sync bib all clean

data:
	python scripts/pull_data.py

validate:
	python scripts/pull_data.py --from-repo

figures: data
	cd interactive && npm run build

diagrams:
	bash scripts/build-tikz.sh

tables: data
	python scripts/tables/build.py

site: figures diagrams tables
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
