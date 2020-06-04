f = open('/heng_props.tsv')
i = open('../../datamart-upload/kgtk_data/uaz_kgtk_variable_properties.tsv')
d = open('../../datamart-upload/kgtk_data/uaz_kgtk_new_properties.tsv')

o = open('../../datamart-upload/kgtk_data/new_property_types.tsv', 'w')
o.write('node1\tlabel\tnode2\n')
_ = {}

for line in f:
    vals = line.split('\t')
    if vals[0] not in _:
        o.write('{}\tdata_type\t{}\n'.format(vals[0], vals[2].strip()))

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
