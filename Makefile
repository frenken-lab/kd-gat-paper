.PHONY: data validate figures diagrams site dev tmlr deploy bib all clean

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
	python scripts/convert_tmlr.py --output submission_folder/

deploy: site
	npx curvenote deploy --yes

bib:
	python scripts/validate_bib.py

all: site

clean:
	rm -rf _build submission_folder figures/*.html
