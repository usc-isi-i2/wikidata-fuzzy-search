'''
Create Datamart variable metadata in jsonl format from the variable cache metadata.
'''

import json
# import gzip
# import typing

from pathlib import Path

from yaml import load, dump
try:
    from yaml import CLoader as Loader, CDumper as Dumper
except ImportError:
    from yaml import Loader, Dumper

from util import DataInterval, Location, Labels, TimePrecision
from datamart import VariableMetadata


property_definitions = {}
for yaml_file in Path('metadata', 'property-yamls').glob('*.yaml'):
    with open(yaml_file, 'r') as input:
        property_definitions.update(load(input, Loader=Loader))

if __name__ == '__main__':
    with open(Path('metadata', 'variables.jsonl'), 'r') as input, \
         open(Path('metadata', 'datamart-variable-metadata.jsonl'), 'w') as output:

        location = Location()
        labels = Labels()
        for line in input:
            variable_metadata = VariableMetadata()
            cache_metadata = json.loads(line)
            variable_metadata.name = cache_metadata['name']
            variable_metadata.variableID = 'V' + cache_metadata['variable_id']
            variable_metadata.datasetID = 'Wikidata'
            shortName = ''
            for alias in cache_metadata['aliases']:
                if len(alias) < len(variable_metadata.name):
                    shortName = alias
                    break
            if shortName:
                variable_metadata.shortName = shortName
            variable_metadata.description = cache_metadata['description']
            variable_metadata.correspondsToProperty = cache_metadata['variable_id']
            variable_metadata.mainSubject = labels.to_object(cache_metadata['main_subject_id'])

            if 'units' in cache_metadata:
                variable_metadata.unitOfMeasure = [
                    {'name': unit['unit'], 'identifier': unit['unit_id']}
                    for unit in cache_metadata['units']]

            # Assume main subject is the location
            variable_metadata.country = labels.to_object(
                location.lookup_countries(cache_metadata['main_subject_id']))
            variable_metadata.location = labels.to_object(
                location.filter(cache_metadata['main_subject_id']))

            variable_metadata.startTime = cache_metadata['startTime']
            variable_metadata.startTime_precision = TimePrecision.to_name(
                max(cache_metadata['precision']))
            variable_metadata.endTime = cache_metadata['endTime']
            variable_metadata.endTime_precision = TimePrecision.to_name(
                max(cache_metadata['precision']))
            variable_metadata.dataInterval = DataInterval.int_to_name(
                max(cache_metadata['precision']))
            variable_metadata.qualifier = [
                {'name': value, 'identifier': key}
                for key, value in cache_metadata['qualifiers'].items()]

            variable_metadata.count = cache_metadata['count']

            if cache_metadata['variable_id'] in property_definitions:
                definition = property_definitions[cache_metadata['variable_id']]
                label = definition.get('label', {}).get('en', '')
                description = definition.get('description', {}).get('en', '')
                urls = []
                identifiers = []
                if not description:
                    description = label
                # URLs
                for url_def in definition.get('statements', {}).get('P1896', []):
                    if 'value' in url_def:
                        urls.append(url_def['value'])
                # world bank ID
                for url in urls:
                    if 'data.worldbank.org/indicator/' in url:
                        identifiers.append(url.split('/')[-1])
                variable_metadata.name = label
                variable_metadata.description = description
                if identifiers:
                    variable_metadata.variableID = 'V' + identifiers[0]
            json_dump = variable_metadata.to_json()
            output.write(json_dump)
            output.write('\n')
