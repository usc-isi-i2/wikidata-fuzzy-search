
# Dataset Variable Metadata

The script backend/generate-metadata.py generates the dataset variable
metadata file backend/metadata/variables.jsonl, and the labels file
metadata/labels.tsv. The script uses SPARQL to directly Wikidata. Just
run the backend/generate-metadata.py script with no arguments.

```
(wikidata) ~/dev/wikidata-fuzzy-search/backend$ python generate-metadata.py
```

```
python generate-metadata.py --output-prefix uaz- --sparql-endpoint http://sitaware.isi.edu:12000/bigdata/namespace/wdq/sparql --variable-properties-file ~/dev/dsbox/uaz-indicator/kgtk_format/uaz_kgtk_variable_properties.tsv

python generate-metadata.py --output-prefix wikidata- --sparql-endpoint http://dsbox02.isi.edu:8899/bigdata/namespace/wdq/sparql
```

The script backend/generate-kgtk-metadata.py converts the
backend/metadata/variables.jsonl file from JSONLines format to KGTK
format, backend/metadata/variable-metadata.tsv.

```
(wikidata) ~/dev/wikidata-fuzzy-search/backend$ python generate-kgtk-metadata.py
```

To convert the KGTK file, variable-metadata.tsv, to ttl format for
upload to Blazegraph, use the KGTK command-line tool. The file
wikidataProps8899.tsv specifies the types of properties, which is used
for validation.

```
(kgtk) ~/dev/wikidata-fuzzy-search/backend$ cat variable-metadata.tsv | kgtk generate_wikidata_triples -pf wikidataProps8899.tsv --debug > variable-metadata.ttl
```

To load the ttl file into Blazegraph, follow the instructions here:

[Blazegraph Quick Start](https://github.com/blazegraph/database/wiki/Quick_Start)


To create Datamart variable metadata in jsonl format from the variable cache metadata.

```
(wikidata) ~/dev/dsbox/wikidata-fuzzy-search/backend$ python to-datamart-json.py
```
