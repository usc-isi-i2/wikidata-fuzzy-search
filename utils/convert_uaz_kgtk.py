from argparse import ArgumentParser
import pandas as pd
import csv
import json

time_precision_dict = {
    'year': '9',
    'month': '10'
}

all_ids_dict = {}

all_qnodes_dict = {}


def update_properties_type(output_path):
    f = open('wikidata_properties_type.tsv')
    i = open('{}/uaz_kgtk_variable_properties_type.tsv'.format(output_path))
    d = open('{}/uaz_kgtk_new_properties.tsv'.format(output_path))

    o = open('{}/new_property_types.tsv'.format(output_path), 'w')
    o.write('node1\tlabel\tnode2\n')
    _ = {}

    for line in f:
        vals = line.split('\t')
        if vals[0] != 'node1':
            if vals[0] not in _:
                o.write('{}\tdata_type\t{}\n'.format(vals[0], vals[2].strip()))
                _[vals[0]] = 1

    for line in i:
        vals = line.split('\t')
        if vals[1] == 'data_type':
            if vals[0] not in _:
                o.write('{}\tdata_type\t{}\n'.format(vals[0], vals[2]))
                _[vals[0]] = 1

    for line in d:
        vals = line.split('\t')
        if vals[1] == 'data_type':
            if vals[0] not in _:
                o.write('{}\tdata_type\t{}\n'.format(vals[0], vals[2]))
                _[vals[0]] = 1

    f_path = 'Canonical Data Format in KGTK.xlsx'
    df = pd.read_excel(f_path, sheet_name='Metadata Properties')
    for i, row in df.iterrows():
        if row['label'] == 'data_type':
            if row['node1'] not in _:
                o.write('{}\tdata_type\t{}\n'.format(row['node1'], row['node2']))
                _[row['node1']] = 1


def create_triple(node1, label, node2):
    id_key = '{}-{}'.format(node1, label)
    if id_key not in all_ids_dict:
        all_ids_dict[id_key] = 0
    else:
        all_ids_dict[id_key] += 1
    id_index = all_ids_dict[id_key]
    return {
        'node1': node1,
        'label': label,
        'node2': node2,
        'id': '{}-{}-{}'.format(node1, label, id_index)
    }


def create_kgtk_units(unit_qnode_dict):
    _ = []
    for unit in unit_qnode_dict:
        _.append(create_triple(unit_qnode_dict[unit], 'label', json.dumps(unit)))
        _.append(create_triple(unit_qnode_dict[unit], 'P31', 'Q47574'))
    df = pd.DataFrame(_)
    cols = ['node1', 'label', 'node2', 'id']
    df = df[cols]
    return df


def create_kgtk_new_properties():
    f_path = 'Canonical Data Format in KGTK.xlsx'
    df = pd.read_excel(f_path, sheet_name='Metadata Properties')
    for i, row in df.iterrows():
        if row['label'] == 'label':
            row['node2'] = '\"{}\"'.format(row['node2'])
    df = df[df['label'] != 'data_type']
    return df


def create_units_qnode(input_path):
    unit_qnode_dict = {}
    df = pd.read_csv(input_path, dtype=object).fillna('')
    units = list(df['value_unit'].unique())
    qnode_number = int(open('next_qnode.txt').readlines()[0].strip())
    for unit in units:
        if unit.strip() not in unit_qnode_dict:
            unit_qnode_dict[unit.strip()] = 'Q{}'.format(qnode_number)
            qnode_number += 1

    open('next_qnode.txt', 'w').write(str(qnode_number))
    open('units_qnode_dict.json', 'w').write(json.dumps(unit_qnode_dict))


def create_variable_qnodes(input_path):
    df = pd.read_csv(input_path, dtype=object).fillna('')
    variables = list(df['variable_id'].unique())
    qnode_number = int(open('next_qnode.txt').readlines()[0].strip())
    pnode_number = int(open('next_pnode.txt').readlines()[0].strip())
    variable_qnode_dict = {}
    variable_pnode_dict = {}

    for variable in variables:
        variable_qnode_dict[variable] = 'Q{}'.format(qnode_number)
        variable_pnode_dict[variable] = 'P{}'.format(pnode_number)
        qnode_number += 1
        pnode_number += 1

    open('next_qnode.txt', 'w').write(str(qnode_number))
    open('next_pnode.txt', 'w').write(str(pnode_number))
    open('variable_qnodes.json', 'w').write(json.dumps(variable_qnode_dict))
    open('variable_pnodes.json', 'w').write(json.dumps(variable_pnode_dict))


def create_kgtk_variables(variable_id, label, dataset, variable_qnode_dict, variable_pnode_dict):
    kgtk_variable_qtemp = list()
    kgtk_variable_ptemp = list()
    kgtk_variable_ptype_temp = list()

    variable_id = variable_id.strip()

    qnode = variable_qnode_dict[variable_id]
    pnode = variable_pnode_dict[variable_id]
    dataset_qnode = 'Q{}'.format(dataset)

    # handle triples for qnode first
    if qnode not in all_qnodes_dict:
        kgtk_variable_qtemp.append(create_triple(qnode, 'label', json.dumps(label)))
        instance_triple = create_triple(qnode, 'P31', 'Q50701')
        instance_triple_id = instance_triple['id']
        kgtk_variable_qtemp.append(instance_triple)
        # kgtk_variable_qtemp.append(create_triple(instance_triple_id, 'P1932', json.dumps(variable_id)))
        kgtk_variable_qtemp.append(create_triple(qnode, 'P1687', pnode))

        time_qualifier_triple = create_triple(qnode, 'P2006020002', "P585")
        kgtk_variable_qtemp.append(time_qualifier_triple)
        kgtk_variable_qtemp.append(create_triple(time_qualifier_triple['id'], 'P1932', json.dumps('time')))

        source_qualifier_triple = create_triple(qnode, 'P2006020002', "P248")
        kgtk_variable_qtemp.append(source_qualifier_triple)
        kgtk_variable_qtemp.append(create_triple(source_qualifier_triple['id'], 'P1932', json.dumps('source')))

        kgtk_variable_qtemp.append(create_triple(qnode, 'P361', dataset_qnode))
        kgtk_variable_qtemp.append(create_triple(qnode, 'P1813', variable_id))

        kgtk_variable_qtemp.append(create_triple(dataset_qnode, 'P2006020003', qnode))
        all_qnodes_dict[qnode] = 1

    if pnode not in all_qnodes_dict:
        kgtk_variable_ptemp.append(create_triple(pnode, 'P31', 'Q18616576'))
        kgtk_variable_ptemp.append(create_triple(pnode, 'label', json.dumps(label)))
        kgtk_variable_ptype_temp.append(create_triple(pnode, 'data_type', 'quantity'))
        all_qnodes_dict[pnode] = 1

    return kgtk_variable_qtemp, kgtk_variable_ptemp, kgtk_variable_ptype_temp


def create_kgtk_measurements(row, unit_qnode_dict, variable_pnode_dict):
    kgtk_measurement_temp = list()
    main_subject = row['main_subject_id'].strip()
    if main_subject:
        variable_id = row['variable_id']
        pvariable_node = variable_pnode_dict[variable_id]
        dataset_qnode = 'Q{}'.format(row['dataset_id'].strip())

        main_triple = create_triple(main_subject, pvariable_node,
                                    '{}{}'.format(row['value'], unit_qnode_dict[row['value_unit']]))
        kgtk_measurement_temp.append(main_triple)

        main_triple_id = main_triple['id']
        kgtk_measurement_temp.append(create_triple(main_triple_id, 'P2006020004', dataset_qnode))

        # kgtk_measurement_temp.append(create_triple(main_triple_id, 'P1880', ))

        kgtk_measurement_temp.append(
            create_triple(main_triple_id, 'P585',
                          '{}/{}'.format('{}{}'.format('^', row['time']), time_precision_dict[row['time_precision']])))
        country_id = row['country_id'].strip()
        if country_id:
            kgtk_measurement_temp.append(create_triple(main_triple_id, 'P17', country_id))

        admin_id = row['admin_id'].strip()
        if admin_id:
            kgtk_measurement_temp.append(create_triple(main_triple_id, 'P131', admin_id))

        place_id = row['place_id'].strip()
        if place_id:
            kgtk_measurement_temp.append(create_triple(main_triple_id, 'P276', place_id))

        source_id = row['source_id'].strip()
        if source_id:
            kgtk_measurement_temp.append(create_triple(main_triple_id, 'P248', source_id))

    return kgtk_measurement_temp


def create_kgtk_datasets(dataset_id):
    kgtk_d_temp = []
    instance_triple = create_triple(dataset_id, 'P31', 'Q1172284')
    kgtk_d_temp.append(instance_triple)
    kgtk_d_temp.append(create_triple(dataset_id, 'label', json.dumps('UAZ Indicators')))
    kgtk_d_temp.append(create_triple(dataset_id, 'P1476', json.dumps("UAZ Indicators")))
    kgtk_d_temp.append(create_triple(dataset_id, 'description', json.dumps(
        "Collection of indicators, including indicators from FAO, WDI, FEWSNET, CLiMIS, UNICEF, ieconomics.com, UNHCR, DSSAT, WHO, IMF, WHP, ACLDE, World Bank and IOM-DTM")))
    kgtk_d_temp.append(create_triple(dataset_id, 'P2699', json.dumps("https://github.com/ml4ai/delphi")))
    kgtk_d_temp.append(create_triple(dataset_id, 'P1813', json.dumps("UAZ")))
    return kgtk_d_temp


def process(input_fp, output_path):
    unit_qnode_dict = json.load(open('units_qnode_dict.json'))
    variable_qnode_dict = json.load(open('variable_qnodes.json'))
    variable_pnode_dict = json.load(open('variable_pnodes.json'))

    input_file_path = input_fp
    kgtk_variable_qpath = '{}/uaz_kgtk_variable_qnodes.tsv'.format(output_path)
    kgtk_variable_ppath = '{}/uaz_kgtk_variable_properties.tsv'.format(output_path)
    kgtk_variable_ptypepath = '{}/uaz_kgtk_variable_properties_type.tsv'.format(output_path)
    kgtk_dataset_path = '{}/uaz_kgtk_dataset.tsv'.format(output_path)

    kgtk_variable_qlist = list()
    kgtk_variable_plist = list()
    kgtk_variable_ptypelist = list()

    kgtk_measurement_path = '{}/uaz_kgtk_measurement.tsv'.format(output_path)

    kgtk_measurement_list = []  #
    df = pd.read_csv(input_file_path, dtype=object).fillna('')

    for i, row in df.iterrows():
        q, p, t = create_kgtk_variables(row['variable_id'], row['variable'], row['dataset_id'].strip(),
                                        variable_qnode_dict, variable_pnode_dict)
        kgtk_variable_qlist.extend(q)
        kgtk_variable_plist.extend(p)
        kgtk_variable_ptypelist.extend(t)

    df_kgtk_qvariable = pd.DataFrame(kgtk_variable_qlist)
    df_kgtk_pvariable = pd.DataFrame(kgtk_variable_plist)
    df_kgtk_pvariabletype = pd.DataFrame(kgtk_variable_ptypelist)
    cols = ['node1', 'label', 'node2', 'id']
    df_kgtk_qvariable = df_kgtk_qvariable[cols]
    df_kgtk_pvariable = df_kgtk_pvariable[cols]
    df_kgtk_pvariabletype = df_kgtk_pvariabletype[cols]
    df_kgtk_qvariable.to_csv(kgtk_variable_qpath, sep='\t', index=False, quoting=csv.QUOTE_NONE)
    df_kgtk_pvariable.to_csv(kgtk_variable_ppath, sep='\t', index=False, quoting=csv.QUOTE_NONE)
    df_kgtk_pvariabletype.to_csv(kgtk_variable_ptypepath, sep='\t', index=False, quoting=csv.QUOTE_NONE)

    df_dataset = pd.DataFrame(create_kgtk_datasets('QUAZ'))
    df_dataset.to_csv(kgtk_dataset_path, index=False, sep='\t', quoting=csv.QUOTE_NONE)

    for i, row in df.iterrows():
        kgtk_measurement_list.extend(create_kgtk_measurements(row, unit_qnode_dict, variable_pnode_dict))

    df_kgtk_m = pd.DataFrame(kgtk_measurement_list)

    df_kgtk_m = df_kgtk_m[cols]
    df_kgtk_m.to_csv(kgtk_measurement_path, sep='\t', index=False, quoting=csv.QUOTE_NONE)

    df_units = create_kgtk_units(unit_qnode_dict)
    df_units.to_csv('{}/uaz_kgtk_units.tsv'.format(output_path), sep='\t', index=False, quoting=csv.QUOTE_NONE)

    df_new_props = create_kgtk_new_properties()
    df_new_props.to_csv('{}/uaz_kgtk_new_properties.tsv'.format(output_path), sep='\t', index=False,
                        quoting=csv.QUOTE_NONE)

    update_properties_type(output_path)


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument("input_file_path", help="The UAZ input csv", type=str)

    parser.add_argument("output_directory_path", help="output directory where files will be written", type=str)
    parsed = parser.parse_args()
    process(input_fp=parsed.input_file_path, output_path=parsed.output_directory_path)

    # create_variable_qnodes(parsed.input_file_path)
    # create_units_qnode(parsed.input_file_path)
