.PHONY: data validate figures diagrams site dev tmlr tmlr-anon deploy bib all clean

data:
	python scripts/pull_data.py

validate:
	python scripts/pull_data.py --from-repo

figures: data
	cd interactive && npm run build

diagrams:
	bash scripts/build-tikz.sh

site: figures diagrams
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
