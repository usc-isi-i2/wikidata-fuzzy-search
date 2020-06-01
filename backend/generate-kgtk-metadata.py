'''
Script to convert metadata in jsonl format to kgtk format.
'''
import os

import settings

from datamart import DatasetMetadata, VariableMetadata
from kgtk import EdgeOutput, id_generator

if __name__ == '__main__':
    variable_id_generator = id_generator('QVWikidata', 0)
    edge_id_generator = id_generator('E', 0)
    defined_label = set()

    with open(os.path.join(settings.BACKEND_DIR, 'metadata', 'datamart-variable-metadata.jsonl'), 'r') as finput, \
         open(os.path.join(settings.BACKEND_DIR, 'metadata', 'datamart-variable-metadata.tsv'), 'w') as output:
        edge_output = EdgeOutput(output)

        edge_output.print_property_edges()
        # Wikidata Qnode
        dataset_qnode = 'Q2013'
        dataset_metadata = DatasetMetadata()
        dataset_metadata.name = "Wikidata Datasets"
        dataset_metadata.description = """Datasets stored directly under Wikidata properties without references to a specific dataset indentifier. Datasets include World Bank indicators."""
        dataset_metadata.url = 'https://www.wikidata.org/wiki/Wikidata:Main_Page'
        dataset_metadata.datasetID = 'Wikidata'
        dataset_edges = dataset_metadata.to_kgtk_edges(
            edge_id_generator,dataset_node=dataset_qnode, defined_labels=defined_label)
        edge_output.print_edges(dataset_edges)
        for line in finput:
            metadata = VariableMetadata()
            metadata.from_json(line)
            new_variable_qnode = next(variable_id_generator)
            variable_edges = metadata.to_kgtk_edges(
                edge_id_generator,dataset_node=dataset_qnode, variable_node=new_variable_qnode,
                defined_labels=defined_label)
            edge_output.print_edges(variable_edges)
