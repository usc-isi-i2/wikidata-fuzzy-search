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
