# Fuzzy Search GUI

## Prerequisites

* [node>=8.1 & npm>=6](https://nodejs.org/en/)

## Deployment

1. Run `cd gui` (skip if you are already in `gui` folder)
2. Configs
	* **packages**: run `npm install`
	* **homepage**: update [`package.json`](https://github.com/usc-isi-i2/wikidata-fuzzy-search/blob/master/gui/package.json) => `homepage`
	* **countries**: update and run `python src/config/countryOptions.py`
	* **others**: update [`src/config/config.json`](https://github.com/usc-isi-i2/wikidata-fuzzy-search/blob/master/gui/src/config/config.json)
	
3. Run `npm run build`

## Development

1. Run `cd gui` (skip if you are already in `gui` folder)
2. Run `npm install`
3. Run `npm start`