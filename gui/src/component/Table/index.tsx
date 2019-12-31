import React from 'react';
import wikiStore from "../../data/store";
import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { CSV } from '../../services/csv';

@observer
export default class Table extends React.Component<{}, {}>{

    render() {
        let csv = new CSV(wikiStore.timeSeries.timeSeries);
        const headers = csv.headers;
        const rows = csv.rows; 
        const Plot = createPlotlyComponent(Plotly);
        return (
            <Plot></Plot>
        )
        /*data={[
          {
            type: 'table',
            header: headers,
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
      />); */
    }
}