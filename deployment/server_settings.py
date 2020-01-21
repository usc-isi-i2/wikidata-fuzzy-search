# This file contains the project-wide settings.
#
# This is a Django style setting files, with an import from local_settings to override the settings, and not a Flask style file.
# The reason is that we need these settings from code that is not Flask code, and that has no access to the global app instance.
#

import os
import sys

DATA_LABEL_AUGMENTATION_PATH = '/home/webapp/src/data-label-augmentation'
CACHE_PATH = '/home/webapp/web/cache'
os.makedirs(CACHE_PATH, exist_ok=True)

WORD2VEC_MODEL_PATH = '/home/webapp/web/data/GoogleNews-vectors-negative300-SLIM.bin'

WD_QUERY_ENDPOINT = 'http://dsbox02.isi.edu:8888/bigdata/namespace/wdq/sparql'
