
import os
import json
import typing

from enum import Enum
from pprint import pprint

from flask import request, make_response
from flask_restful import Resource
from SPARQLWrapper import SPARQLWrapper, JSON, CSV

import pandas as pd

import settings

sparql = SPARQLWrapper(settings.WD_QUERY_ENDPOINT)

with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'label.json'), 'rb') as f:
    label = json.load(f)

with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'contains.json')) as f:
    contains = json.load(f)

region_df = pd.read_csv(os.path.join(settings.BACKEND_DIR, 'metadata', 'region.csv'), dtype=str)
region_df = region_df.fillna('')
for column in ['country', 'admin1', 'admin2', 'admin3']:
    region_df.loc[:, column] = region_df.loc[:, column].map(lambda s: s.lower())

country_qnode = {}
for row in region_df.itertuples():
    if row.country not in country_qnode:
        country_qnode[row.country] = 'wd:' + row.country_id

# with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'country.json')) as f:
#     country_qnode = json.load(f)


QUALIFIERS = {
    'time': 'pq:P585',
    'curator': 'pq:P1640'
}

class ColumnStatus(Enum):
    REQUIRED = 0
    DEFAULT = 1
    OPTIONAL = 2

COMMON_COLUMN = {
    'dataset_id': ColumnStatus.OPTIONAL,
    'variable': ColumnStatus.REQUIRED,
    'variable_id': ColumnStatus.OPTIONAL,
    'category': ColumnStatus.OPTIONAL,
    'main_subject': ColumnStatus.REQUIRED,
    'main_subject_id': ColumnStatus.DEFAULT,
    'value': ColumnStatus.REQUIRED,
    'value_unit': ColumnStatus.DEFAULT,
    'time': ColumnStatus.REQUIRED,
    'time_precision': ColumnStatus.DEFAULT,
    'country': ColumnStatus.DEFAULT,
    'country_id': ColumnStatus.OPTIONAL,
    'admin1': ColumnStatus.DEFAULT,
    'admin1_id': ColumnStatus.OPTIONAL,
    'admin2': ColumnStatus.DEFAULT,
    'admin2_id': ColumnStatus.OPTIONAL,
    'admin3': ColumnStatus.DEFAULT,
    'admin3_id': ColumnStatus.OPTIONAL,
    'place': ColumnStatus.DEFAULT,
    'place_id': ColumnStatus.OPTIONAL,
    'coordinate': ColumnStatus.DEFAULT,
    'shape': ColumnStatus.OPTIONAL
}


VARIABLE_METADATA = {
    'P4010' : { # GDP
        'variable': 'GDP (PPP)',
        'time_precision': 9,
        'value_unit': 'international United States dollar',
        'admin_level': 0,
        'qualifiers': {},
        'main_subject': [
            "wd:Q31", "wd:Q155", "wd:Q183", "wd:Q148", "wd:Q45", "wd:Q1183", "wd:Q1044", "wd:Q1049", "wd:Q398", "wd:Q298", "wd:Q233",
            "wd:Q912", "wd:Q863", "wd:Q869", "wd:Q878", "wd:Q916", "wd:Q1027", "wd:Q1006", "wd:Q1007", "wd:Q801", "wd:Q819", "wd:Q686",
            "wd:Q258", "wd:Q252", "wd:Q262", "wd:Q30", "wd:Q213", "wd:Q1036", "wd:Q242", "wd:Q672", "wd:Q668", "wd:Q702", "wd:Q710",
            "wd:Q695", "wd:Q717", "wd:Q948", "wd:Q929", "wd:Q43", "wd:Q664", "wd:Q38", "wd:Q212", "wd:Q145", "wd:Q189", "wd:Q115", "wd:Q222",
            "wd:Q221", "wd:Q229", "wd:Q27", "wd:Q1033", "wd:Q1032", "wd:Q574", "wd:Q736", "wd:Q739", "wd:Q734", "wd:Q712", "wd:Q697",
            "wd:Q691", "wd:Q1037", "wd:Q1039", "wd:Q750", "wd:Q783", "wd:Q805", "wd:Q781", "wd:Q889", "wd:Q843", "wd:Q874", "wd:Q928",
            "wd:Q114", "wd:Q159", "wd:Q211", "wd:Q23635", "wd:Q236", "wd:Q214", "wd:Q224", "wd:Q265", "wd:Q408", "wd:Q334", "wd:Q769",
            "wd:Q458", "wd:Q774", "wd:Q786", "wd:Q796", "wd:Q945", "wd:Q881", "wd:Q921", "wd:Q953", "wd:Q822", "wd:Q854", "wd:Q813", "wd:Q14773",
            "wd:Q1009", "wd:Q21203", "wd:Q1041", "wd:Q219060", "wd:Q1011", "wd:Q1005", "wd:Q963", "wd:Q1014", "wd:Q1842", "wd:Q1025", "wd:Q1029",
            "wd:Q33", "wd:Q403", "wd:Q414", "wd:Q419", "wd:Q424", "wd:Q55", "wd:Q683", "wd:Q685", "wd:Q757", "wd:Q218", "wd:Q244", "wd:Q217",
            "wd:Q917", "wd:Q826", "wd:Q763", "wd:Q977", "wd:Q8646", "wd:Q17", "wd:Q20", "wd:Q1000", "wd:Q238", "wd:Q34", "wd:Q215", "wd:Q1246",
            "wd:Q191", "wd:Q1013", "wd:Q1016", "wd:Q1008", "wd:Q35", "wd:Q41", "wd:Q37", "wd:Q399", "wd:Q77", "wd:Q754", "wd:Q678", "wd:Q760",
            "wd:Q804", "wd:Q810", "wd:Q792", "wd:Q811", "wd:Q837", "wd:Q817", "wd:Q836", "wd:Q902", "wd:Q842", "wd:Q851", "wd:Q962", "wd:Q954",
            "wd:Q967", "wd:Q924", "wd:Q142", "wd:Q16", "wd:Q1042", "wd:Q1020", "wd:Q983", "wd:Q970", "wd:Q974", "wd:Q184", "wd:Q227", "wd:Q232",
            "wd:Q225", "wd:Q29", "wd:Q28", "wd:Q36", "wd:Q39", "wd:Q766", "wd:Q657", "wd:Q709", "wd:Q784", "wd:Q778", "wd:Q800", "wd:Q117",
            "wd:Q96", "wd:Q79", "wd:Q8268", "wd:Q230", "wd:Q40", "wd:Q219", "wd:Q32", "wd:Q730", "wd:Q733", "wd:Q711", "wd:Q833", "wd:Q794",
            "wd:Q790", "wd:Q846", "wd:Q1030", "wd:Q59987349", "wd:Q1050", "wd:Q5785", "wd:Q965", "wd:Q971", "wd:Q884", "wd:Q958", "wd:Q986",
            "wd:Q1028", "wd:Q1019"
            ]
        },
    'P3036' : { # rain
        'variable': 'precipitation height',
        'time_precision': 9,
        'value_unit': 'mm',
        'admin_level': 3,
        'qualifiers': {},
        'main_subject': [
            # "wd:Q4586871" 1991 Halloween blizzard
            "wd:Q3972011", "wd:Q4190393", "wd:Q15222316", "wd:Q67758019", "wd:Q22222608",
            "wd:Q10931418", "wd:Q5439840", "wd:Q2071241", "wd:Q16957182", "wd:Q16964887", "wd:Q16965400",
            # "wd:Q2374856", "wd:Q2376156", "wd:Q2381608", "wd:Q2382572", "wd:Q2391504", "wd:Q2422429",
            # "wd:Q2597088", "wd:Q2654779", "wd:Q2821455", "wd:Q2820216", "wd:Q2824059", "wd:Q2823862",
            # "wd:Q2824689", "wd:Q2826421", "wd:Q2832369", "wd:Q2832649", "wd:Q2832643", "wd:Q2841417",
            # "wd:Q2842131", "wd:Q2843318", "wd:Q2849236", "wd:Q2864413", "wd:Q2860849", "wd:Q2866446",
            # "wd:Q2880302", "wd:Q2893465", "wd:Q2896892", "wd:Q2893815", "wd:Q2893566", "wd:Q2896994",
            # "wd:Q2909209", "wd:Q2902631", "wd:Q2910804", "wd:Q2928317", "wd:Q2963919", "wd:Q2964388",
            # "wd:Q2964481", "wd:Q2972032", "wd:Q2973346", "wd:Q2973686", "wd:Q2973716", "wd:Q3015333",
            # "wd:Q3016116", "wd:Q3021070", "wd:Q3021096", "wd:Q3023542", "wd:Q3026870", "wd:Q3022296",
            # "wd:Q3029342", "wd:Q3033676", "wd:Q3041004", "wd:Q3049548", "wd:Q304246", "wd:Q3067952",
            # "wd:Q3068406", "wd:Q3100056", "wd:Q3100103", "wd:Q3100263", "wd:Q3103838", "wd:Q3103930",
            # "wd:Q3105402", "wd:Q3106653", "wd:Q3106655", "wd:Q3106713", "wd:Q3107593", "wd:Q3109573",
            # "wd:Q3109968", "wd:Q3110313", "wd:Q3110373", "wd:Q3111360", "wd:Q3118829", "wd:Q3111366",
            # "wd:Q3120969", "wd:Q3125408", "wd:Q3127995", "wd:Q3125691", "wd:Q3135217", "wd:Q3138657",
            # "wd:Q3162804", "wd:Q3176822", "wd:Q3176850", "wd:Q3178986", "wd:Q3178990", "wd:Q3195516",
            # "wd:Q3195526", "wd:Q3198395", "wd:Q3198251", "wd:Q3198528", "wd:Q3200537", "wd:Q3200732",
            # "wd:Q3216542", "wd:Q3229049", "wd:Q3237714", "wd:Q3241122", "wd:Q3285143", "wd:Q3241124",
            # "wd:Q3303887", "wd:Q3306658", "wd:Q3307179", "wd:Q3307182", "wd:Q3312796", "wd:Q3307516",
            # "wd:Q3327625", "wd:Q3326979", "wd:Q3327847", "wd:Q3337870", "wd:Q3338054", "wd:Q3342884",
            # "wd:Q3343373", "wd:Q3343374", "wd:Q3346443", "wd:Q3349300", "wd:Q3401949", "wd:Q3402023",
            # "wd:Q3402033", "wd:Q3434318", "wd:Q3473789", "wd:Q3477985", "wd:Q3479998", "wd:Q3482960",
            # "wd:Q3481927", "wd:Q3480862", "wd:Q3502932", "wd:Q351427", "wd:Q3517952", "wd:Q3517432",
            # "wd:Q3528408", "wd:Q3529978", "wd:Q3529396", "wd:Q3552120", "wd:Q3566240", "wd:Q3567298",
            # "wd:Q3569781", "wd:Q3570146", "wd:Q3571228", "wd:Q3573095", "wd:Q374201", "wd:Q4670620",
            # "wd:Q4749007", "wd:Q4723965", "wd:Q4716049", "wd:Q4752601", "wd:Q4837972", "wd:Q4913557",
            # "wd:Q4941221", "wd:Q4944247", "wd:Q4938669", "wd:Q4938667", "wd:Q4945120", "wd:Q5076096",
            # "wd:Q5094504", "wd:Q5100089", "wd:Q5104933", "wd:Q5207520", "wd:Q5210678", "wd:Q5242290",
            # "wd:Q5210625", "wd:Q5248544", "wd:Q5274247", "wd:Q5275497", "wd:Q5275598", "wd:Q5276575",
            # "wd:Q5277133", "wd:Q5278718", "wd:Q5287998", "wd:Q5312499", "wd:Q5379022", "wd:Q5297724",
            # "wd:Q5530360", "wd:Q5528474", "wd:Q5526420", "wd:Q5559484", "wd:Q5530589", "wd:Q55612440",
            # "wd:Q55623083", "wd:Q5564315", "wd:Q5575602", "wd:Q5580914", "wd:Q5586768", "wd:Q5617682",
            # "wd:Q5618018", "wd:Q5618457", "wd:Q5621831", "wd:Q5636596", "wd:Q5644196", "wd:Q56489850",
            # "wd:Q56605479", "wd:Q56611938", "wd:Q5684158", "wd:Q590292", "wd:Q5904662", "wd:Q5904664",
            # "wd:Q6159615", "wd:Q6192004", "wd:Q6199291", "wd:Q6192157", "wd:Q6393737", "wd:Q6398810",
            # "wd:Q6408249", "wd:Q6431569", "wd:Q6480552", "wd:Q6520555", "wd:Q666087", "wd:Q6549969",
            # "wd:Q6934311", "wd:Q6841084", "wd:Q6698715", "wd:Q693640", "wd:Q741581", "wd:Q7487115",
            # "wd:Q7521774", "wd:Q7492254", "wd:Q7530072", "wd:Q7553400", "wd:Q7813527", "wd:Q7966892",
            # "wd:Q784515", "wd:Q7959167", "wd:Q787088", "wd:Q7976892", "wd:Q797696", "wd:Q8050552",
            # "wd:Q8052059", "wd:Q940315", "wd:Q974511", "wd:Q960789"
            ]
    },
    'P1200149' : { # flood
        'variable': 'flood duration in a month',
        'time_precision': 9,
        'value_unit': 'day',
        'admin_level': 3,
        'qualifiers': {
            'significant_event': 'pq:P793'
        },
        'qualifier_label': {
            'Q1000000000': '2-year flood',
            'Q1000000001': '5-year flood',
	    'Q1000000002': '20-year flood'
        },
        'main_subject': [
            "wd:Q2374856", "wd:Q2376156", "wd:Q16965400", "wd:Q16964887", "wd:Q15222316", "wd:Q16957182",
            "wd:Q2597088", "wd:Q2391504", "wd:Q2654779", "wd:Q2422429", "wd:Q2821455", "wd:Q2824689",
            # "wd:Q2824059", "wd:Q2823862", "wd:Q2820216", "wd:Q2841417", "wd:Q2842131", "wd:Q2832649",
            # "wd:Q2832643", "wd:Q2382572", "wd:Q2381608", "wd:Q2832369", "wd:Q2826421", "wd:Q2866446",
            # "wd:Q2864413", "wd:Q2860849", "wd:Q2849236", "wd:Q2843318", "wd:Q2880302", "wd:Q2893465",
            # "wd:Q2893566", "wd:Q2896892", "wd:Q2893815", "wd:Q2896994", "wd:Q2909209", "wd:Q2910804",
            # "wd:Q2902631", "wd:Q2964481", "wd:Q2964388", "wd:Q2972032", "wd:Q2963919", "wd:Q2928317",
            # "wd:Q2973346", "wd:Q2973686", "wd:Q2973716", "wd:Q3022296", "wd:Q3021096", "wd:Q3021070",
            # "wd:Q3015333", "wd:Q3016116", "wd:Q3023542", "wd:Q3029342", "wd:Q3026870", "wd:Q3033676",
            # "wd:Q3041004", "wd:Q304246", "wd:Q3100263", "wd:Q3100103", "wd:Q3068406", "wd:Q3100056",
            # "wd:Q3103838", "wd:Q3103930", "wd:Q3049548", "wd:Q3067952", "wd:Q3105402", "wd:Q3106653",
            # "wd:Q3106655", "wd:Q3109573", "wd:Q3109968", "wd:Q3110313", "wd:Q3110373", "wd:Q3107593",
            # "wd:Q3106713", "wd:Q3118829", "wd:Q3120969", "wd:Q3125408", "wd:Q3111360", "wd:Q3111366",
            # "wd:Q3127995", "wd:Q3135217", "wd:Q3125691", "wd:Q3176822", "wd:Q3162804", "wd:Q3138657",
            # "wd:Q3195516", "wd:Q3195526", "wd:Q3178990", "wd:Q3178986", "wd:Q3176850", "wd:Q3198395",
            # "wd:Q3198528", "wd:Q3198251", "wd:Q3200732", "wd:Q3200537", "wd:Q3216542", "wd:Q3241122",
            # "wd:Q3237714", "wd:Q3229049", "wd:Q3285143", "wd:Q3241124", "wd:Q3307179", "wd:Q3306658",
            # "wd:Q3303887", "wd:Q3312796", "wd:Q3307182", "wd:Q3307516", "wd:Q3326979", "wd:Q3327625",
            # "wd:Q3327847", "wd:Q3338054", "wd:Q3342884", "wd:Q3337870", "wd:Q3401949", "wd:Q3343374",
            # "wd:Q3346443", "wd:Q3349300", "wd:Q3343373", "wd:Q3402023", "wd:Q3402033", "wd:Q3434318",
            # "wd:Q3479998", "wd:Q3477985", "wd:Q3473789", "wd:Q3480862", "wd:Q3481927", "wd:Q351427",
            # "wd:Q3482960", "wd:Q3502932", "wd:Q3517952", "wd:Q3517432", "wd:Q3528408", "wd:Q3552120",
            # "wd:Q3529978", "wd:Q3529396", "wd:Q3567298", "wd:Q3569781", "wd:Q3566240", "wd:Q3571228",
            # "wd:Q3570146", "wd:Q374201", "wd:Q3573095", "wd:Q4670620", "wd:Q4749007", "wd:Q4752601",
            # "wd:Q4837972", "wd:Q4913557", "wd:Q4723965", "wd:Q4716049", "wd:Q4938669", "wd:Q4938667",
            # "wd:Q4941221", "wd:Q4944247", "wd:Q4945120", "wd:Q5076096", "wd:Q5094504", "wd:Q5100089",
            # "wd:Q5104933", "wd:Q5210625", "wd:Q5207520", "wd:Q5248544", "wd:Q5210678", "wd:Q5242290",
            # "wd:Q5275497", "wd:Q5274247", "wd:Q5276575", "wd:Q5277133", "wd:Q5275598", "wd:Q5278718",
            # "wd:Q5297724", "wd:Q5287998", "wd:Q5526420", "wd:Q5312499", "wd:Q5379022", "wd:Q55612440",
            # "wd:Q5559484", "wd:Q5530589", "wd:Q5530360", "wd:Q5528474", "wd:Q5564315", "wd:Q5575602",
            # "wd:Q55623083", "wd:Q5586768", "wd:Q5580914", "wd:Q5617682", "wd:Q5644196", "wd:Q5621831",
            # "wd:Q5636596", "wd:Q5618018", "wd:Q5618457", "wd:Q56611938", "wd:Q56489850", "wd:Q56605479",
            # "wd:Q5684158", "wd:Q590292", "wd:Q5904662", "wd:Q5904664", "wd:Q6159615", "wd:Q6192004",
            # "wd:Q6199291", "wd:Q6192157", "wd:Q6393737", "wd:Q6398810", "wd:Q6408249", "wd:Q6431569",
            # "wd:Q6520555", "wd:Q6480552", "wd:Q666087", "wd:Q6698715", "wd:Q6549969", "wd:Q6934311",
            # "wd:Q693640", "wd:Q6841084", "wd:Q7487115", "wd:Q7530072", "wd:Q7521774", "wd:Q7492254",
            # "wd:Q741581", "wd:Q7813527", "wd:Q784515", "wd:Q7553400", "wd:Q7959167", "wd:Q787088",
            # "wd:Q7966892", "wd:Q797696", "wd:Q7976892", "wd:Q940315", "wd:Q8050552", "wd:Q8052059",
            # "wd:Q974511", "wd:Q960789"
        ]
    }
}

def lookup_place(admin_level: int, qnode: str):
    result = {}
    if qnode.startswith('wd:'):
        qnode = qnode[3:]
    if admin_level == 0:
        result['country_id'] = qnode
        result['country'] = label.get(qnode, '')
    else:
        result['country_id'] = contains['toCountry'].get(qnode, '')
        result['country'] = label.get(result['country_id'], '')
    if admin_level == 3:
        result['admin3_id'] = qnode
        result['admin3'] = label.get(qnode, '')
        if qnode in contains['toAdmin2']:
            admin_level = 2
            qnode = contains['toAdmin2'][qnode]
    if admin_level == 2:
        result['admin2_id'] = qnode
        result['admin2'] = label.get(qnode, '')
        if qnode in contains['toAdmin1']:
            admin_level = 1
            qnode = contains['toAdmin1'][qnode]
    if admin_level == 1:
        result['admin1_id'] = qnode
        result['admin1'] = label.get(qnode, '')
    return result

# for qnode in VARIABLE_METADATA['P1200149']['main_subject']:
#     result = lookup_place(3, qnode)
#     print(result)

class GeographyLevel(Enum):
    COUNTRY = 0
    ADMIN1 = 1
    ADMIN2 = 2
    ADMIN3 = 3
    OTHER = 4


class ApiDataset(Resource):
    def get(self, dataset=None, variable=None):
        if dataset != 'Qwikidata' and dataset != 'Qwikidata2':
            content = {
                'Error': f'path not found: /datasets/{dataset}',
                'Usage': 'Use path /datasets/Qwikidata/variables/{variable}'
            }
            return content, 404
        if variable is None:
            content = {
                'Error': f'path not found: /datasets/{dataset}/variables/{variable}',
                'Usage': f'Use path /datasets/{dataset}/variables/{{PNode}}',
                'Example': f'Use path /datasets/{dataset}/variables/P1200149'
            }
            return content, 404

        include_cols = []
        exclude_cols = []
        main_subjects = []
        limit = -1
        if request.args.get('include') is not None:
            include_cols = request.args.get('include').split(',')
        if request.args.get('exclude') is not None:
            exclude_cols = request.args.get('exclude').split(',')
        if request.args.get('limit') is not None:
            try:
                limit = int(request.args.get('limit'))
            except:
                pass

        # Add main subject by exact English label
        for keyword in ['country', 'admin1', 'admin2', 'admin3']:
            if request.args.get(keyword) is not None:
                admins = [x.lower() for x in request.args.get(keyword).split(',')]
                index = region_df.loc[:, keyword].isin(admins)
                print(f'Add {keyword}:', region_df.loc[index, keyword + '_id'].unique())
                main_subjects += ['wd:' + x for x in region_df.loc[index, keyword + '_id'].unique()]

        # Add main subject by qnode
        for keyword in ['main_subject_id', 'country_id', 'admin1_id', 'admin2_id', 'admin3_id']:
            if request.args.get(keyword) is not None:
                qnodes = request.args.get(keyword).split(',')
                print(f'Add {keyword}:', qnodes)
                main_subjects += ['wd:' + x for x in qnodes]

        # Add administrative locations using the name of parent administrative location
        for keyword, admin_col, lower_admin_col in zip(
                ['in_country', 'in_admin1', 'in_admin2'],
                ['country', 'admin1', 'admin2'],
                ['admin1_id', 'admin2_id', 'admin3_id']):
            if request.args.get(keyword) is not None:
                admins = [x.lower() for x in request.args.get(keyword).split(',')]
                index = region_df.loc[:, admin_col].isin(admins)
                print(f'Add {keyword}({request.args.get(keyword)}):', region_df.loc[index, lower_admin_col].unique())
                main_subjects += ['wd:' + x for x in region_df.loc[index, lower_admin_col].unique()]

        # Add administrative locations using the qnode of parent administrative location
        for keyword, admin_col, lower_admin_col in zip(
                ['in_country_id', 'in_admin1_id', 'in_admin2_id'],
                ['country_id', 'admin1_id', 'admin2_id'],
                ['admin1_id', 'admin2_id', 'admin3_id']):
            if request.args.get(keyword) is not None:
                admin_ids = request.args.get(keyword).split(',')
                index = region_df.loc[:, admin_col].isin(admin_ids)
                print(f'Add {keyword}({request.args.get(keyword)}):', region_df.loc[index, lower_admin_col].unique())
                main_subjects += ['wd:' + x for x in region_df.loc[index, lower_admin_col].unique()]

        if dataset == 'Qwikidata':
            return self.get_using_cache(variable, include_cols, exclude_cols, limit, main_subjects=main_subjects)
        else:
            return self.get_no_cache(variable, include_cols, exclude_cols, limit)

    def get_no_cache(self, variable, include_cols, exclude_cols, limit):
        variable_uri = 'p:' +  variable
        place_uris = self.get_places(variable_uri)
        print(f'place_uris = {place_uris}')
        admin_level = self.get_max_admin_level(variable_uri, place_uris[:10])
        print(f'admin_level = {admin_level}')
        qualifiers = self.get_dataset_qualifiers(variable_uri, place_uris)
        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)

        response = self.get_dataset(variable, select_cols, qualifiers, place_uris, limit)
        # pprint(response)
        result_df = pd.DataFrame(columns=response['head']['vars'],
                                 index=range(len(response['results']['bindings'])))
        for row, record in enumerate(response['results']['bindings']):
            for col, name in enumerate(response['head']['vars']):
                if name in record:
                    result_df.iloc[row, col] = record[name]['value']
        csv = result_df.to_csv(index=False)
        output = make_response(csv)
        output.headers['Content-Disposition'] = f'attachment; filename={variable}.csv'
        output.headers['Content-type'] = 'text/csv'
        return output

    def get_using_cache(self, variable, include_cols, exclude_cols, limit, main_subjects=[]):
        metadata = self.get_variable_metadata(variable)
        variable_uri = 'p:' +  variable

        if main_subjects:
            place_uris = main_subjects
        else:
            place_uris = metadata['main_subject']
        admin_level = metadata['admin_level']
        qualifiers = metadata['qualifiers']

        response = self.get_minimal_dataset(variable, qualifiers, place_uris, limit)
        # pprint(response)

        select_cols = self.get_columns(admin_level, include_cols, exclude_cols, qualifiers)
        print(select_cols)

        # Needed for place columns
        if 'main_subject_id' in select_cols:
            temp_cols = select_cols
        else:
            temp_cols = ['main_subject_id'] + select_cols
        result_df = pd.DataFrame(columns=temp_cols,
                                  index=range(len(response['results']['bindings'])))
        for row, record in enumerate(response['results']['bindings']):
            for col_name, typed_value in record.items():
                value = typed_value['value']
                if col_name in result_df.columns:
                    col = result_df.columns.get_loc(col_name)
                    result_df.iloc[row, col] = value
                if col_name not in COMMON_COLUMN.keys():
                    qualifier = col_name[:-3]
                    if qualifier not in select_cols:
                        continue
                    if value in metadata['qualifier_label']:
                        result_df.iloc[row, result_df.columns.get_loc(qualifier)] = metadata['qualifier_label'][value]
                    else:
                        print('missing qualifier label: ', value)
        result_df.loc[:, 'variable'] = metadata['variable']
        result_df.loc[:, 'value_unit'] = metadata['value_unit']
        result_df.loc[:, 'time_precision'] = metadata['time_precision']
        for main_subject_id in result_df.loc[:, 'main_subject_id'].unique():
            place = lookup_place(admin_level, main_subject_id)
            index = result_df.loc[:, 'main_subject_id'] == main_subject_id
            if main_subject_id in label:
                result_df.loc[index, 'main_subject'] = label[main_subject_id]
            for col, val in place.items():
                if col in select_cols:
                    result_df.loc[index, col] = val

        print(result_df.head())
        if 'main_subject_id' not in select_cols:
            result_df = result_df.drop(columns=['main_subject_id'])

        csv = result_df.to_csv(index=False)
        output = make_response(csv)
        output.headers['Content-Disposition'] = f'attachment; filename={variable}.csv'
        output.headers['Content-type'] = 'text/csv'
        return output

    def get_minimal_dataset(self, variable, qualifiers, place_uris, limit):
        select_columns = '?main_subject_id ?value ?time ' + ' '.join(f'?{name}_id' for name in qualifiers.keys())

        qualifier_query = ''
        for name, pq_property in qualifiers.items():
            qualifier_query += f'''
  ?o {pq_property} ?{name}_ .
  BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
'''
  # ?{name}_ skos:prefLabel ?{name} .
  # FILTER((LANG(?{name})) = "en")
        dataset_query = self.get_minimal_dataset_query(variable, select_columns, qualifier_query, place_uris, limit)
        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response

    def get_dataset(self, variable, select_columns, qualifiers, place_uris, limit=-1):
        select_columns = ' '.join(f'?{name}' for name in select_columns)

        qualifier_optionals = ''
        for name, pq_property in qualifiers.items():
            qualifier_optionals += f'''
  OPTIONAL {{ ?o {pq_property} ?{name}_ .
    ?{name}_ skos:prefLabel ?{name} .
    FILTER((LANG(?{name})) = "en")
    BIND(REPLACE(STR(?{name}_), "(^.*)(Q.\\\\d+$)", "$2") AS ?{name}_id)
  }}
'''
        dataset_query = self.get_dataset_query(variable, select_columns, qualifier_optionals, place_uris, limit)
        sparql.setQuery(dataset_query)
        sparql.setReturnFormat(JSON)
        result = sparql.query()
        response = result.convert()
        return response


    def get_minimal_dataset_query(self, variable, select_columns, qualifier_query, place_uris, limit):

        dataset_query = f'''
SELECT {select_columns} WHERE {{
  VALUES(?variable_ ?p ?ps) {{
      (wd:{variable} p:{variable} ps:{variable})
  }}

  VALUES ?main_subject_ {{
    {' '.join(place_uris)}
  }}
  ?main_subject_ ?p ?o .
  ?o ?ps ?value .

  ?o pq:P585 ?time .

  {qualifier_query}

  BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d+$)", "$2") AS ?main_subject_id)

}}
ORDER BY ?main_subject_id ?time
'''
        if limit > -1:
            dataset_query = dataset_query + f'\nLIMIT {limit}'
        print(dataset_query)
        return dataset_query

    def get_dataset_query(self, variable, select_columns, qualifier_optionals, place_uris, limit):
        dataset_query = f'''
SELECT {select_columns} WHERE {{
  VALUES(?variable_ ?p ?ps) {{
      (wd:{variable} p:{variable} ps:{variable})
  }}

  VALUES ?main_subject_ {{
    {' '.join(place_uris)}
  }}
  ?main_subject_ ?p ?o .
  ?o ?ps ?value .

  # OPTIONAL {{ ?main_subject_ ?p ?statement . ?statement (pqv:P585/wikibase:timePrecision) ?precision. }}
  # OPTIONAL {{ ?o (pqv:P585/wikibase:timePrecision) ?time_precision. }}


  ?o pq:P585 ?time .
  {qualifier_optionals}

  ?variable_ skos:prefLabel ?variable .
  ?main_subject_ skos:prefLabel ?main_subject .
  FILTER((LANG(?variable)) = "en")
  FILTER((LANG(?main_subject)) = "en")

  BIND("Qwikidata" AS ?dataset_id)
  BIND(REPLACE(STR(?variable_), "(^.*)(P.\\\\d+$)", "$2") AS ?variable_id)
  BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d+$)", "$2") AS ?main_subject_id)

  OPTIONAL {{
    ?main_subject_ wdt:P17 ?country_ .
    ?main_subject_ skos:prefLabel ?country .
    FILTER((LANG(?country)) = "en")
    BIND(REPLACE(STR(?main_subject_), "(^.*)(Q.\\\\d+$)", "$2") AS ?country_id)
  }}
  OPTIONAL {{
    # If is a third level admin (district)
    ?main_subject_ wdt:P31/wdt:P279 wd:Q13221722.
    BIND(?main_subject_ as ?admin3_)
    ?admin3_ wdt:P131 ?admin2_ .
    ?admin2_ wdt:P131 ?admin1_ .

    ?admin1_ skos:prefLabel ?admin1 .
    ?admin2_ skos:prefLabel ?admin2 .
    ?admin3_ skos:prefLabel ?admin3 .
    FILTER((LANG(?admin1)) = "en")
    FILTER((LANG(?admin2)) = "en")
    FILTER((LANG(?admin3)) = "en")
    BIND(REPLACE(STR(?admin1_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin1_id)
    BIND(REPLACE(STR(?admin2_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin2_id)
    BIND(REPLACE(STR(?admin3_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin3_id)
  }}
  OPTIONAL {{
    # If is second level admin (zone)
    ?main_subject_ wdt:P31/wdt:P279 wd:Q13220204 .
    BIND(?main_subject_ as ?admin2_)
    ?admin2_ wdt:P131 ?admin1_ .

    ?admin1_ skos:prefLabel ?admin1 .
    ?admin2_ skos:prefLabel ?admin2 .
    FILTER((LANG(?admin1)) = "en")
    FILTER((LANG(?admin2)) = "en")
    BIND(REPLACE(STR(?admin1_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin1_id)
    BIND(REPLACE(STR(?admin2_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin2_id)
  }}
  OPTIONAL {{
    # If is first level admin (region)
    ?main_subject_ wdt:P31/wdt:P279 wd:Q10864048 .
    BIND(?main_subject_ as ?admin1_)

    ?admin1_ skos:prefLabel ?admin1 .
    FILTER((LANG(?admin1)) = "en")
    BIND(REPLACE(STR(?admin1_), "(^.*)(Q.\\\\d+$)", "$2") AS ?admin1_id)
  }}

  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
ORDER BY ?variable ?main_subject ?time
'''
        if limit > -1:
            dataset_query = dataset_query + f'\nLIMIT {limit}'
        print(dataset_query)
        return dataset_query

    def get_dataset_qualifiers(self, variable_uri, place_uris) -> dict:
        qualifiers = self.get_qualifiers(variable_uri, place_uris)

        # remove common qualifiers
        if 'point in time' in qualifiers:
            del qualifiers['point in time']
        else:
            print(f'Variable {variable_uri} does not have time qualifiers!')
        if 'curator' in qualifiers:
            del qualifiers['curator']

        # rename qualifiers
        temp = {}
        for key, value in qualifiers.items():
            temp[key.replace(' ', '_')] = value
        qualifiers = temp
        return qualifiers

    def get_qualifiers(self, variable_uri, place_uris) -> dict:
        qualifer_query = f'''
SELECT DISTINCT ?qualifierLabel ?qualifierUri WHERE {{
    VALUES ?place {{ {' '.join(place_uris[:5])} }}
    ?place {variable_uri} ?statement .
    ?statement ?pq ?pqv .
    ?qualifier wikibase:qualifier ?pq .
    BIND (STR(REPLACE(STR(?pq), STR(pq:), "pq:")) AS ?qualifierUri)
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
        print(qualifer_query)
        sparql.setQuery(qualifer_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        # pprint(response)
        qualifiers = {}
        for record in response['results']['bindings']:
            qualifiers[record['qualifierLabel']['value']] = record['qualifierUri']['value']
        return qualifiers


    def get_max_admin_level(self, variable_uri, place_uris):
        admin_query = f'''
SELECT DISTINCT ?adminLevel ?adminLevelLabel WHERE {{
    VALUES ?place {{ {' '.join(place_uris)} }}
    ?place {variable_uri} ?statement .
    ?place wdt:P31/wdt:P279 ?adminLevel .
    SERVICE wikibase:label {{bd:serviceParam wikibase:language "en". }}
}}
'''
        print(admin_query)
        sparql.setQuery(admin_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        pprint(response)
        max_admin_level = 0
        for record in response['results']['bindings']:
            admin_level_uri = record['adminLevel']['value']
            admin_level = 0
            if admin_level_uri.endswith('Q13221722'):
                admin_level = 3
            elif admin_level_uri.endswith('Q13220204'):
                admin_level = 2
            elif admin_level_uri.endswith('Q10864048'):
                admin_level = 1
            if admin_level > max_admin_level:
                max_admin_level = admin_level
            if max_admin_level == 3:
                break
        return max_admin_level

    def get_places(self, variable_uri) -> typing.List[str]:
        place_query = f'''
SELECT DISTINCT ?place ?place_Label WHERE {{
    ?place_ {variable_uri} ?statement .
    BIND (STR(REPLACE(STR(?place_), STR(wd:), "wd:")) AS ?place)
    SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
}}
'''
        print(place_query)
        sparql.setQuery(place_query)
        sparql.setReturnFormat(JSON)
        response = sparql.query().convert()
        pprint(response)
        place_uris = []
        for record in response['results']['bindings']:
            qnode = record['place']['value']
            place_uris.append(qnode)
        return place_uris

    def get_columns(self, admin_level, include_cols, exclude_cols, qualifiers) -> typing.List[str]:
        result = []
        for col, status in COMMON_COLUMN.items():
            if status == ColumnStatus.REQUIRED or col in include_cols:
                result.append(col)
                continue
            if col in exclude_cols:
                continue
            if status == ColumnStatus.DEFAULT:
                if col.startswith('admin'):
                    level = int(col[5])
                    if level <= admin_level:
                        result.append(col)
                else:
                    result.append(col)
        for col in qualifiers:
            if col not in exclude_cols:
                result.append(col)
            col_id = f'{col}_id'
            if col_id in include_cols:
                result.append(col_id)
        return result

    def get_variable_metadata(self, variable: str) -> dict:
        if variable in VARIABLE_METADATA:
            return VARIABLE_METADATA[variable]

    def generate_metadata(self, variable: str) -> dict:
        variable_uri = 'p:' +  variable
        place_uris = self.get_places(variable_uri)
        print(f'place_uris = {place_uris}')
        admin_level = self.get_max_admin_level(variable_uri, place_uris[:10])
        print(f'admin_level = {admin_level}')
        qualifiers = self.get_dataset_qualifiers(variable_uri, place_uris)

        metadata = {}
        return metadata
