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
        const result = wikiStore.timeSeries.results[0];
        let csv = new CSV(result.time_points);
        const columns = csv.headers.map(header => {
            return {
                Header: header, 
                accessor: header 
            }
        });
        
        return <div className="try">
            <ReactTable data={result.time_points} columns={columns} className='react-table' />
        </div>
    }
        
}