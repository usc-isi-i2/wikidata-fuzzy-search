# Wikidata fuzzy search

## Prerequisite

```
pip install flask SPARQLWrapper
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

```
> curl -s "localhost:5000/linking/wikidata?keywords=population&country=Q30" | jq .

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
        "score": 0.1367812519585043
      },
      {
        "name": "P6499",
        "label": "literate population",
        "description": "number of literate people within a territorial entity (typically determined during a census)",
        "aliases": [],
        "time": null,
        "score": 0.09676332910599851
      },
      {
        "name": "P6498",
        "label": "illiterate population",
        "description": "number of illiterate people within a territorial entity (typically determined during a census)",
        "aliases": [],
        "time": null,
        "score": 0.0664412965715167
      },
      {
        "name": "P100002",
        "label": "access to electricity",
        "description": "Access to electricity, urban is the percentage of urban population with access to electricity.",
        "aliases": [],
        "time": null,
        "score": 0.05791676521564282
      },
      {
        "name": "P2662",
        "label": "consumption rate per capita",
        "description": "rate of consumption of a product divided by the population",
        "aliases": [],
        "time": null,
        "score": 0.05469093824201703
      },
      {
        "name": "P1193",
        "label": "prevalence",
        "description": "portion of a population with a given disease",
        "aliases": [],
        "time": null,
        "score": 0.05285721391746937
      },
      {
        "name": "P1539",
        "label": "female population",
        "description": "number of female people inhabiting the place; number of female people of subject",
        "aliases": [],
        "time": null,
        "score": 0.050047442925847736
      },
      {
        "name": "P1540",
        "label": "male population",
        "description": "number of male people inhabiting the place; number of male people of subject",
        "aliases": [
          "male inhabitants",
          "number of males"
        ],
        "time": null,
        "score": 0.049204482004782196
      },
      {
        "name": "P1198",
        "label": "unemployment rate",
        "description": "portion of a workforce population that is not employed",
        "aliases": [],
        "time": "P585",
        "score": 0.04578110170166968
      },
      {
        "name": "P6897",
        "label": "literacy rate",
        "description": "percentage of the population that is not illiterate",
        "aliases": [
          "literate population (%)",
          "percentage of literate population"
        ],
        "time": null,
        "score": 0.02288485017097585
      }
    ]
  }
]
```