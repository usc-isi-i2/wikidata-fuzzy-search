import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

@observer
export default class LineChart extends React.Component<{}, {}>{

    buildLineArray(){
        let objMap = {};
        wikiStore.ui.timeSeriesResult.time_points.forEach(function(obj){
            let key = obj['point_in_time'];
            if (!(key in objMap)) {
                objMap[key] = []
            }
            objMap[key].push(obj['value']);
        });
        let x =Object.keys(objMap);
        let y = [];
        Object.keys(objMap).forEach(function(key) {
            let avg = objMap[key].reduce((p, c)=> Number(p)+Number(c))/objMap[key].length;
            y.push(avg);
        });
        return [x,y]
    }
    render() {
        let result=this.buildLineArray()
        const Plot = createPlotlyComponent(Plotly);
        return (
            <Plot
        data={[
          {
            x: result[0],
            y: result[1],
            type: 'lines',
            mode: 'Lines',
            name: wikiStore.ui.regionName,
            showlegend: true,
            marker: {color: wikiStore.ui.timeSeriesResult.visualiztionParams.color},
          },
        ]}
        layout={ {width:'auto', height: 'auto', title: wikiStore.ui.name} }
      />
        );
    }
}