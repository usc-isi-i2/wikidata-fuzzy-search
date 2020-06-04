
kgtk cat kgtk_data/uaz_kgtk_dataset.tsv kgtk_data/uaz_kgtk_variable_qnodes.tsv kgtk_data/uaz_kgtk_variable_properties.tsv kgtk_data/uaz_kgtk_measurement.tsv kgtk_data/uaz_kgtk_units.tsv kgtk_data/uaz_kgtk_new_properties.tsv > kgtk_data/uaz_kgtk_all_unsorted.tsv
kgtk sort kgtk_data/uaz_kgtk_all_unsorted.tsv -c id > kgtk_data/uaz_kgtk_all.tsv
