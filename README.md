# Wikidata fuzzy search

## Prerequisite

```
pip install flask flask-cors SPARQLWrapper
```

Download word2vec model: `GoogleNews-vectors-negative300-SLIM.bin` and place it to `data-label-augmentation/data/GoogleNews-vectors-negative300-SLIM.bin`.

## Instruction

Update indices:

```
python update_index.py
```

Start web service

```
python ws.py
```

## Queries

`time` is `null` if no qualifier of that property for that country can be found.

`statistics` only appears when `time` is not `null`.

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
          "count": "52"
        },
        "score": 0.12711246014589833
      },
      {
        "name": "P6499",
        "label": "literate population",
        "description": "number of literate people within a territorial entity (typically determined during a census)",
        "aliases": [],
        "time": null,
        "qualifiers": {},
        "score": 0.09306288181984022
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
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
          "count": "59"
        },
        "score": 0.07329026879389922
      }
    ]
  }
]
```
