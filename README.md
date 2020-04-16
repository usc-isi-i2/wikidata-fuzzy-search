# Wikidata fuzzy search

## Prerequisite
```
cd backend
```
Create a virtual environment in the `env` directory and install the requirements (on Windows, don't use Python 3.8 yet - as of January 2020, since not all packages have precompiled binary wheels. Python 3.7 works fine. Replace `py` with `python3` if you don't have the Python Launcher installed).
```
py -m venv env --prompt="wikidata"
pip install -r requirements.txt
```

Download word2vec model: [`GoogleNews-vectors-negative300-SLIM.bin`](https://github.com/eyaler/word2vec-slim/raw/master/GoogleNews-vectors-negative300-SLIM.bin.gz), unzip and place it in `backend/data-label-augmentation/data/GoogleNews-vectors-negative300-SLIM.bin`.

## Get the Data Label Augmenter repository
You need to clone the Data Label Augmenter repository to a side folder of this project. The repository is private, so you need to get permission to do that - without it you cannot run the backend.


So, if you are in the root directory of this repository (the directory containing this file), do
```
cd ..
git clone git@github.com:usc-isi-i2/data-label-augmentation.git
```

You now need to install that project's requirements into the virtual environment (the same virtual environment you have created before)

```
cd data-label-augmentation/src/label-augmenter
pip install -r requirements.txt
```

## Configuration
The backend has a `settings.py` file that contains reasonable default. To override these settings at a `local_settings.py` file. You probably shouldn't change the settings if you are not deploying the backend.

The frontend has a `.env` file that also contains reasonable defaults.

## Updating indices
You need to update the cache and indices for the backend to work. This is simple. From the backend folder run

```
python cache.py
```
If you want to refresh the cache and indices add `--reload`

Start web service

```
python ws.py
```

## Visual Studio Code
We have provided tasks and debugger launch configurations for Visual Studio Code. Unfortunately the settings file depends on your OS - Windows or Linux (Macs are considered Linux). We have provided two
sample settings files, `.vscode/settings.linux.json` and `.vscode/settings.windows.json` . Please copy the appropriate one into `.vscode/settings.json`, then start Visual Studio Code.

If you are using PyCharm, you will need to add the `backend` folder, as well as `../data-label-augmentation/src/label-augmenter` to the PYTHON PATH.


# Leftovers from the old README file
## Queries

`time` is `null` if no qualifier of that property for that country can be found.

`statistics` only appears when `time` is not `null`. In `statistics`, `max_precision` is the most precise precision, it can be `null` if none of the time value has precision.

```
> curl -s "localhost:14000/linking/wikidata?keywords=population&country=Q30" | jq .

[
  {
    "keyword": "population",
    "augmentation": {
      "population": 1,
      "populations": 1,
      "populace": 1,
      "inhabitants": 1,
      "populaton": 1,
      "populous": 1,
      "landmass": 1,
      "census": 1
    },
    "alignments": [
      {
        "name": "P1082",
        "label": "population",
        "description": "number of people inhabiting the place; number of people of subject",
        "aliases": [
          "human population",
          "inhabitants"
        ],
        "time": "P585",
        "qualifiers": {
          "P585": "point in time",
          "P459": "determination method",
          "P1539": "female population",
          "P1540": "male population"
        },
        "statistics": {
          "max_time": "2017-01-01T00:00:00Z",
          "min_time": "1790-01-01T00:00:00Z",
          "count": 52,
          "max_precision": 11
        },
        "score": 0.1271124601458984
      },
      {
        "name": "P6499",
        "label": "literate population",
        "description": "number of literate people within a territorial entity (typically determined during a census)",
        "aliases": [],
        "time": null,
        "qualifiers": {},
        "score": 0.09306288181984021
      },
      {
        "name": "P111322",
        "label": "Population ages 05-09, female (% of female population)",
        "description": "Female population between the ages 5 to 9 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111324",
        "label": "Population ages 10-14, female (% of female population)",
        "description": "Female population between the ages 10 to 14 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111354",
        "label": "Population ages 80 and above, female (% of female population)",
        "description": "Female population between the ages 80 and above as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111319",
        "label": "Population ages 00-04, female (% of female population)",
        "description": "Female population between the ages 0 to 4 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111341",
        "label": "Population ages 50-54, female (% of female population)",
        "description": "Female population between the ages 50 to 54 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111343",
        "label": "Population ages 55-59, female (% of female population)",
        "description": "Female population between the ages 55 to 59 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111350",
        "label": "Population ages 70-74, female (% of female population)",
        "description": "Female population between the ages 70 to 74 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      },
      {
        "name": "P111352",
        "label": "Population ages 75-79, female (% of female population)",
        "description": "Female population between the ages 75 to 79 as a percentage of the total female population.",
        "aliases": [],
        "time": "P585",
        "qualifiers": {
          "P275": "license",
          "P585": "point in time",
          "P248": "stated in"
        },
        "statistics": {
          "max_time": "2018-01-01T00:00:00Z",
          "min_time": "1960-01-01T00:00:00Z",
          "count": 59,
          "max_precision": 9
        },
        "score": 0.07329026879389923
      }
    ]
  }
]
```
