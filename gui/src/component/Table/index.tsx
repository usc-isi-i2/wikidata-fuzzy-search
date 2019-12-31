import React from 'react';
import wikiStore from "../../data/store";
import { observer } from 'mobx-react';
import { CSV } from '../../services/csv';
import ReactTable from 'react-table-v6'
import 'react-table-v6/react-table.css'

@observer
export default class Table extends React.Component<{}, {}>{

    render() {
        let csv = new CSV(wikiStore.timeSeries.timeSeries);
        const columns = csv.headers.map(header => {
            return {
                Header: header, 
                accessor: header 
            }
        });

        const tableStyle = {
            overflow: 'auto',
            width: '100%',
            height: '100%',
        }
        return <div style={tableStyle}>
            <ReactTable data={wikiStore.timeSeries.timeSeries} columns={columns} />
        </div>
    }
        
}