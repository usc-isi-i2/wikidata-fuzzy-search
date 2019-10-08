import os
import sys
import glob
import json

from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse

sys.path.append('data-label-augmentation')
sys.path.append('data-label-augmentation/src/label_augmenter/')
WORD2VEC_MODEL_PATH = 'data-label-augmentation/data/GoogleNews-vectors-negative300-SLIM.bin'
from linking_script import *

app = Flask(__name__)
api = Api(app)
configs = {}
resources = {}

CONFIG_DIR_PATH = os.path.abspath(os.path.join('cfg/', '*.yml'))

with open('data/wikidata.json') as f:
    all_pnodes = json.loads(f.read())


class WikidataLinkingScript(LinkingScript):
    def process(self, keywords):
        self.source_data = self.load_source_data(keywords)
        self.source_data_filtered = self.filter_source_data(self.source_data)
        self.source_data_aug = self.augment_source_data(self.source_data_filtered)
        self.source_data_aug_filtered = unweighted_to_weighted(self.filter_augmented_source_data(self.source_data_aug))

        alignments = self.align_datasets(self.source_data_aug_filtered, 
                                         self.target_data_aug_filtered)

        augmentations = {k: s.word_map for k, s in zip(keywords, self.source_data_aug_filtered)}
        alignlist = []
        for alignment in alignments.keys():
            alignmap = dict()
            alignmap['keyword'] = alignment
            alignmap['augmentation'] = augmentations[alignment]
            alignmap['alignments'] = []
            for aligned in alignments[alignment]:
                alignedmap = dict()
                if aligned["wl"] is not None:
                    if aligned["wl"].get_key() is not None:
                        pnode = aligned["wl"].get_key()
                        alignedmap['name'] = pnode
                        # alignedmap["desc"] = aligned["wl"].get_original_string()
                        for k, v in all_pnodes[pnode].items():
                            alignedmap[k] = v
                    else:
                        alignedmap["name"] = aligned["wl"].get_original_string()
                alignedmap["score"] = aligned["score"]
                alignmap['alignments'].append(alignedmap)
            alignlist.append(alignmap)
        return alignlist


def load_resources():
    # preload resources
    print('loading resources...')
    resources['GNews_SLIM_model'] = load_word2vec_model(WORD2VEC_MODEL_PATH, binary=True)

    # configs
    for config_path in glob.glob(CONFIG_DIR_PATH):
        print('loading config:', config_path)
        k = os.path.splitext(os.path.basename(config_path))[0]
        configs[k] = {
            'abspath': config_path,
            'config': make_YML_config(config_path),
            'script': {
                'alignment': None,
                'linking': None
            }
        }
        configs[k]['config'].set_augmenter_preload_resources(resources)

    # load datasets
    for k in configs.keys():
        print('loading datasets...', k)
        script = WikidataLinkingScript(configs[k]['config'])
        script.prepare_datasets()
        configs[k]['script']['linking'] = script

class ApiRoot(Resource):
    def get(self):
        return 'Data augmentation web service'

class ApiConfig(Resource):
    def get(self):
        return list(configs.keys())

class ApiLinking(Resource):
    def get(self, config_name):
        if not config_name in configs:
            return {'error': 'Invalid config name'}, 500
        # wordmap = request.args.get('wordmap', default=False, type=bool)
        keywords = request.args.get('keywords', None)
        if not keywords:
            return {'error': 'Invalid keywords'}, 400

        keywords = list(map(lambda x: x.strip(), keywords.split(',')))
        country = request.args.get('country', None)
        if not country:
            return {'error': 'Invalid country'}, 400

        script = configs[config_name]['script']['linking']
        # if wordmap:
        #     return script.get_word_map(keywords)

        align_list = script.process(keywords)
        return align_list



api.add_resource(ApiRoot, '/')
api.add_resource(ApiConfig, '/config')
api.add_resource(ApiLinking, '/linking/<string:config_name>')

if __name__ == '__main__':
    load_resources()
    app.run(debug=False, host="127.0.0.1")
