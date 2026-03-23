.PHONY: data validate figures diagrams tables site dev tmlr tmlr-anon deploy bib all clean

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
	myst build

dev:
	myst start

tmlr: figures
	python scripts/tmlr/build.py --output submission_folder/

tmlr-anon: figures
	python scripts/tmlr/build.py --output submission_folder/ --anonymous

deploy: site
	npx curvenote deploy --yes

bib:
	python scripts/validate_bib.py

all: site

clean:
	rm -rf _build submission_folder figures/*.html
	find data/tables -name '*.md' -delete 2>/dev/null || true
