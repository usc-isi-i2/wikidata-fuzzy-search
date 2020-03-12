# Cache various data items that are always being calculated at startup

import pickle
import settings
import argparse
from update_index import update_index

settings.set_python_path()
# pylint: disable=import-error
from linking_script import LinkingScript
# pylint: enable=import-error

import os

def get_cache_filename(name):
    return os.path.join(settings.CACHE_PATH, f'{name}.dat')

def unpickle_object(name):
    filename = get_cache_filename(name)
    with open(filename, 'rb') as f:
        return pickle.load(f)

def pickle_object(name, obj):
    filename = get_cache_filename(name)
    with open(filename, 'wb') as f:
        return pickle.dump(obj, f)


class CacheAwareLinkingScript(LinkingScript):
    def prepare_datasets(self):
        self.target_data = unpickle_object('target_data')
        self.target_data_filtered = unpickle_object('target_data_filtered')
        self.target_data_aug = unpickle_object('target_data_aug')
        self.target_data_aug_filtered  = unpickle_object('target_data_aug_filtered')


def cache_linking_script(ls):
    pickle_object('target_data', ls.target_data)
    pickle_object('target_data_filtered', ls.target_data_filtered)
    pickle_object('target_data_aug', ls.target_data_aug)
    pickle_object('target_data_aug_filtered', ls.target_data_aug_filtered)

def cache_resources():
    from fuzzy import load_resources  # Import here, since fuzzy imports this file as well

    print('Preparing data, this may take a few minutes...')
    config = load_resources(LinkingScript)
    script = config['script']['linking']
    print('Storing data in cache at ', settings.CACHE_PATH)
    cache_linking_script(script)
    print('Done')

def get_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--reload', default=False, type=bool, help='Reloads information even if it is already cached')
    return parser.parse_args()

def run():
    args = get_args()
    saved = False
    if args.reload or not os.path.exists(settings.get_wikidata_csv_path()):
        print('Loading indices')
        update_index()
        saved = True
    if args.reload or not os.path.exists(get_cache_filename('target_data_aug_filtered')):
        print('Caching resources')
        cache_resources()
        saved = True

    if not saved:
        print('Cache is up to date, nothing done')

if __name__ == '__main__':
    run()