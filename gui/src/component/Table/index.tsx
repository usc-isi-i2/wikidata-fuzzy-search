import React from 'react';
import wikiStore from "../../data/store";
import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { useTable, useSortBy} from 'react-table'

@observer
export default class Table extends React.Component<{}, {}>{

    buildTableData() {
        let headersSet = new Set()
        wikiStore.timeSeries.timeSeries.forEach(function(obj){ //find all possible headers
            Object.keys(obj).forEach(function(key){
                if(!(headersSet.has(key))){
                    headersSet.add(key);
                }
            })
        });
        let headresArrayFromSet = Array.from(headersSet);
        let headers=[];
        headresArrayFromSet.forEach(function(elem){
            let headerObj = {"Header": elem}
            headers.push(headerObj);
        });
        let rows = []
        wikiStore.timeSeries.timeSeries.forEach(function(obj){
            let rowObj ={}
            headresArrayFromSet.forEach(function(key:string){
                if (!(key in obj))
                {
                    rowObj[key] = null;
                }
                else
                rowObj[key]= obj[key]
            })
            rows.push(rowObj);
        });
        debugger
        return [headers,rows];

    }
    
    render() {
        let result = this.buildTableData();
        const headers = result[0];
        const rows = result[1]; 
        const Plot = createPlotlyComponent(Plotly);
        var values = [
            ['Salaries', 'Office', 'Merchandise', 'Legal', '<b>TOTAL</b>'],
            [1200000, 20000, 80000, 2000, 12120000],
            [1300000, 20000, 70000, 2000, 130902000],
            [1300000, 20000, 120000, 2000, 131222000],
            [1400000, 20000, 90000, 2000, 14102000]]
        return (
            <Plot
        data={[
          {
            type: 'table',
            header: {
              values: [["<b>EXPENSES</b>"], ["<b>Q1</b>"],
                           ["<b>Q2</b>"], ["<b>Q3</b>"], ["<b>Q4</b>"]],
              align: ["left", "center"],
              line: {width: 1, color: '#506784'},
              fill: {color: '#119DFF'},
              font: {family: "Arial", size: 12, color: "white"}
            },
            cells: {
              values: values,
              align: ["left", "center"],
              line: {color: "#506784", width: 1},
               fill: {color: ['#25FEFD', 'white']},
              font: {family: "Arial", size: 11, color: ["#506784"]}
            }
          },
        ]}
        layout={ {width:'auto', height: 'auto', title: 'A Fancy Plot'} }
      />
        );
    }
}