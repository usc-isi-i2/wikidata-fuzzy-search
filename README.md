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

### Search

`time` is `null` if no qualifier of that property for that country can be found.

`statistics` only appears when `time` is not `null`. In `statistics`, `max_precision` is the most precise precision, it can be `null` if none of the time value has precision.

```
> curl -s "localhost:14000/search?keywords=population&country=Q30" | jq .

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

# Admin level

```
> curl -s http://localhhost:14000/admin?country=Q115 | jq .

{
  "Q3624": "Addis Ababa",
  "Q207638": "Gambela Region",
  "Q1033855": "Harari Region",
  "Q193494": "Afar",
  "Q203193": "Southern Nations, Nationalities, and Peoples' Region",
  "Q207635": "Benishangul-Gumuz Region",
  "Q193486": "Dire Dawa",
  "Q200127": "Tigray Region",
  "Q202800": "Somali Region",
  "Q203009": "Amhara Region",
  "Q202107": "Oromia Region"
}

> curl -s http://localhhost:14000/admin?country=Q115&admin_1=Q202107 | jq .

{
  "Q351427": "Adama",
  "Q1109889": "Mirab Hararghe Zone",
  "Q1109833": "Mirab Shewa Zone",
  "Q3478428": "Semien Shewa Zone",
  "Q5248635": "Debub Mirab Shewa Zone",
  "Q704885": "Arsi Oromo",
  "Q1109846": "Misraq Shewa Zone",
  "Q1109855": "Borena Zone",
  "Q5904662": "Horo Gudru Welega Zone",
  "Q1109877": "Jimma Zone",
  "Q804883": "Bale Zone",
  "Q5617057": "Guji Zone",
  "Q6385564": "Kelem Welega Zone",
  "Q3113831": "Misraq Hararghe Zone",
  "Q646859": "Arsi Zone",
  "Q1109870": "Misraq Welega Zone",
  "Q1709377": "Mirab Welega Zone",
  "Q6872255": "Mirab Arsi Zone",
  "Q768586": "Illubabor Zone"
}

> curl -s http://localhhost:14000/admin?country=Q115&admin_1=Q202107&admin_2=Q5617057 | jq .

{
  "Q7959167": "Wadera",
  "Q5277133": "Dima",
  "Q2910804": "Bore",
  "Q6393737": "Kercha",
  "Q3552120": "Uraga",
  "Q3237714": "Liben",
  "Q55603877": "Ana Sora",
  "Q5644196": "Hambela Wamena",
  "Q5564315": "Girja",
  "Q2824689": "Adola",
  "Q56581969": "Kebri Mangest",
  "Q3349300": "Odo Shakiso",
  "Q55613410": "Harenfema"
}
```
