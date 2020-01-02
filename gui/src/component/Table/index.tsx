import React from 'react';
import wikiStore from "../../data/store";
import { observer } from 'mobx-react';
import { CSV } from '../../services/csv';
import ReactTable from 'react-table-v6'
import 'react-table-v6/react-table.css'
import './table.css';
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
        
        return <div className="try">
            <ReactTable data={wikiStore.timeSeries.timeSeries} columns={columns} className='react-table' />
        </div>
    }
        
}