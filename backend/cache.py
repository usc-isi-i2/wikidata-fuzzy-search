# Cache various data items that are always being calculated at startup

import pickle
import settings

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


if __name__ == '__main__':
    from fuzzy import load_resources, configs  # Import here, since fuzzy imports this file as well

    print('Preparing data, this may take a few minutes...')
    load_resources(LinkingScript)
    script = configs['wikidata']['script']['linking']
    print('Storing data in cache at ', settings.CACHE_PATH)
    cache_linking_script(script)
    print('Done')
