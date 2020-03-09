# The Flask application

from flask import Flask, request, jsonify
from flask_restful import Api, Resource, reqparse
from flask_cors import CORS
from wikidata import ApiWikidata
from fuzzy import configs, load_resources
from regions import ApiRegion
from async_queries import ApiAsyncQuery

app = Flask(__name__)
api = Api(app)
CORS(app)

load_resources()

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
        #ApiAsyncQuery.get(keywords, country)
        align_list = script.process(keywords, country)
        return align_list

api.add_resource(ApiRoot, '/')
api.add_resource(ApiConfig, '/config')
api.add_resource(ApiLinking, '/linking/<string:config_name>')
api.add_resource(ApiWikidata, '/wikidata')
api.add_resource(ApiRegion, '/region', '/region/<string:country>', '/region/<string:country>/<string:admin1>', '/region/<string:country>/<string:admin1>/<string:admin2>')
#api.add_resource(ApiAsyncQuery, '/query')

app.add_url_rule
if __name__ == '__main__':
    app.run(debug=False, host="0.0.0.0", port=14000)
