# This file contains the project-wide settings.
#
# This is a Django style setting files, with an import from local_settings to override the settings, and not a Flask style file.
# The reason is that we need these settings from code that is not Flask code, and that has no access to the global app instance.
#

import os
import sys

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(BACKEND_DIR)  # Root of the project
OUTER_BASE_DIR = os.path.dirname(BASE_DIR) # Folder containing both projects (wikidata-fuzzy-search and data-label-augmentation)

DATA_LABEL_AUGMENTATION_PATH = os.path.join(OUTER_BASE_DIR, 'data-label-augmentation')
CACHE_PATH = os.path.join(BASE_DIR, 'cache', 'models')
LINKING_SCRIPT_CONFIG_PATH = os.path.join(BACKEND_DIR, 'cfg')
WORD2VEC_MODEL_PATH = os.path.join(BACKEND_DIR, 'data-label-augmentation', 'data', 'GoogleNews-vectors-negative300-SLIM.bin')

WIKIDATA_INDEX_PATH = os.path.join(BASE_DIR, 'cache', 'index')

WD_QUERY_ENDPOINT = 'http://dsbox02.isi.edu:8899/bigdata/namespace/wdq/sparql'
# WD_QUERY_ENDPOINT = 'http://sitaware.isi.edu:12000/bigdata/namespace/wdq/sparql'
BLAZEGRAPH_QUERY_ENDPOINT = 'http://127.0.0.1:9999/blazegraph/namespace/metadata/sparql'
POSTGRES = dict(
    dbname = 'wikidata',
    host = 'localhost',
    port = 5433,
    user = 'postgres',
    password = 'postgres',
)

BACKEND_MODE = 'postgres'  # Either 'postgres' or 'sparql'

try:
    from local_settings import *
except ImportError:
    pass

def set_python_path():
    def add_path(path):
        if path not in sys.path:
            sys.path.append(path)

    add_path(DATA_LABEL_AUGMENTATION_PATH)
    add_path(os.path.join(DATA_LABEL_AUGMENTATION_PATH, 'src', 'label_augmenter'))

def get_wikidata_csv_path():
    return os.path.join(WIKIDATA_INDEX_PATH, 'wikidata.csv')

def get_wikidata_json_path():
    return os.path.join(WIKIDATA_INDEX_PATH, 'wikidata.json')


os.makedirs(CACHE_PATH, exist_ok=True)
os.makedirs(WIKIDATA_INDEX_PATH, exist_ok=True)
