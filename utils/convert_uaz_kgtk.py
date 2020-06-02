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
    df.to_csv('uaz_kgtk_units.tsv', sep='\t', index=False, quoting=csv.QUOTE_NONE)


def create_kgtk_new_properties():
    f_path = '../../datamart-upload/kgtk_data/Canonical Data Format in KGTK.xlsx'
    df = pd.read_excel(f_path, sheet_name='New Properties')
    for i, row in df.iterrows():
        if row['label'] == 'label':
            row['node2'] = '\"{}\"'.format(row['node2'])
    df.to_csv('uaz_kgtk_new_properties.tsv', sep='\t', index=False, quoting=csv.QUOTE_NONE)


def create_units_qnode(units):
    unit_qnode_dict = {}
    idx = 0
    qnode_template = 'QUAZUnit-'
    for unit in units:
        if unit.strip() not in unit_qnode_dict:
            unit_qnode_dict[unit.strip()] = '{}{}'.format(qnode_template, idx)
            idx += 1
    return unit_qnode_dict


def create_kgtk_variables(variable_id, label, dataset):
    kgtk_variable_qtemp = list()
    kgtk_variable_ptemp = list()
    variable_id = variable_id.strip()
    qnode = 'Q{}'.format(variable_id)
    pnode = 'P{}'.format(variable_id)
    dataset_qnode = 'Q{}'.format(dataset)

    # handle triples for qnode first
    if qnode not in all_qnodes_dict:
        kgtk_variable_qtemp.append(create_triple(qnode, 'label', json.dumps(label)))
        kgtk_variable_qtemp.append(create_triple(qnode, 'P31', 'Q50701'))
        kgtk_variable_qtemp.append(create_triple(qnode, 'PcorrespondsToProperty', pnode))

        time_qualifier_triple = create_triple(qnode, 'PhasQualifier', json.dumps("P585"))
        kgtk_variable_qtemp.append(time_qualifier_triple)
        kgtk_variable_qtemp.append(create_triple(time_qualifier_triple['id'], 'P1932', json.dumps('time')))

        source_qualifier_triple = create_triple(qnode, 'PhasQualifier', json.dumps("P248"))
        kgtk_variable_qtemp.append(source_qualifier_triple)
        kgtk_variable_qtemp.append(create_triple(source_qualifier_triple['id'], 'P1932', json.dumps('source')))

        kgtk_variable_qtemp.append(create_triple(qnode, 'P361', dataset_qnode))

        kgtk_variable_qtemp.append(create_triple(dataset_qnode, 'PvariableMeasured', qnode))
        all_qnodes_dict[qnode] = 1

    if pnode not in all_qnodes_dict:
        kgtk_variable_ptemp.append(create_triple(pnode, 'P31', 'Q18616576'))
        kgtk_variable_ptemp.append(create_triple(pnode, 'label', json.dumps(label)))
        kgtk_variable_ptemp.append(create_triple(pnode, 'data_type', 'quantity'))
        all_qnodes_dict[pnode] = 1

    return kgtk_variable_qtemp, kgtk_variable_ptemp


def create_kgtk_measurements(row, unit_qnode_dict):
    kgtk_measurement_temp = list()
    main_subject = row['main_subject_id'].strip()
    if main_subject:
        variable_id = row['variable_id']
        pvariable_node = 'P{}'.format(variable_id)
        dataset_qnode = 'Q{}'.format(row['dataset_id'].strip())

        main_triple = create_triple(main_subject, pvariable_node,
                                    json.dumps('{}{}'.format(row['value'], unit_qnode_dict[row['value_unit']])))
        kgtk_measurement_temp.append(main_triple)

        main_triple_id = main_triple['id']
        kgtk_measurement_temp.append(create_triple(main_triple_id, 'Pdataset', dataset_qnode))

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


def process(input_fp, unit_qnode_dict_path):
    # df = pd.read_csv('uaz.csv', dtype=object).fillna('')
    # units = list(df['value_unit'].unique())
    # unit_qnode_dict = create_units_qnode(units)

    # open('units_qnode_dict.json', 'w').write(json.dumps(unit_qnode_dict, indent=2))

    unit_qnode_dict = json.load(open(unit_qnode_dict_path))

    input_file_path = input_fp
    kgtk_variable_qpath = 'uaz_kgtk_variable_qnodes.tsv'
    kgtk_variable_ppath = 'uaz_kgtk_variable_properties.tsv'

    kgtk_variable_qlist = list()
    kgtk_variable_plist = list()

    kgtk_measurement_path = '../../datamart-upload/kgtk_data/uaz_kgtk_measurement.tsv'

    kgtk_measurement_list = []  #
    df = pd.read_csv(input_file_path, dtype=object).fillna('')

    for i, row in df.iterrows():
        q, p = create_kgtk_variables(row['variable_id'], row['variable'], row['dataset_id'].strip())
        kgtk_variable_qlist.extend(q)
        kgtk_variable_plist.extend(p)

    df_kgtk_qvariable = pd.DataFrame(kgtk_variable_qlist)
    df_kgtk_pvariable = pd.DataFrame(kgtk_variable_plist)
    cols = ['node1', 'label', 'node2', 'id']
    df_kgtk_qvariable = df_kgtk_qvariable[cols]
    df_kgtk_pvariable = df_kgtk_pvariable[cols]
    df_kgtk_qvariable.to_csv(kgtk_variable_qpath, sep='\t', index=False, quoting=csv.QUOTE_NONE)
    df_kgtk_pvariable.to_csv(kgtk_variable_ppath, sep='\t', index=False, quoting=csv.QUOTE_NONE)

    for i, row in df.iterrows():
        kgtk_measurement_list.extend(create_kgtk_measurements(row, unit_qnode_dict))

    df_kgtk_m = pd.DataFrame(kgtk_measurement_list)

    df_kgtk_m = df_kgtk_m[cols]
    df_kgtk_m.to_csv(kgtk_measurement_path, sep='\t', index=False, quoting=csv.QUOTE_NONE)

    create_kgtk_units(unit_qnode_dict)
    create_kgtk_new_properties()


if __name__ == '__main__':
    parser = ArgumentParser()
    parser.add_argument("input_file_path", help="The UAZ input csv", type=str, nargs='+')

    parser.add_argument("-u", "--unit-qnode-json", dest="unit_qnode_dict",
                        help="unit to qnode dictionary", type=str)
    parsed = parser.parse_args()
    process(input_fp=parsed.input_file_path, unit_qnode_dict_path=parsed.unit_qnode_dict)