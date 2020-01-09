import React from 'react';
import wikiStore from "../../data/store";
import { observer } from 'mobx-react';
import ReactTable from 'react-table-v6'
import 'react-table-v6/react-table.css'
import './table.css';
@observer
export default class Table extends React.Component<{}, {}>{

    render() {
        const result = wikiStore.timeSeries.result;
        const columns = result.headers.map(header => {
            return {
                Header: header, 
                accessor: header 
            }
        });
        
        return <div className="try">
            <ReactTable data={result.points} columns={columns} className='react-table' />
        </div>
    }
        
}