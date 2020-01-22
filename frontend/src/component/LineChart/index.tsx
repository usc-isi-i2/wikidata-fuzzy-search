import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import { VisualizationParams } from '../../customizations/visualizations-params';

interface LineChartProperties {
}

@observer
export default class LineChart extends React.Component<LineChartProperties, {}>{

    buildLineArray() {
        let objMap = {};
        wikiStore.timeSeries.result.points.forEach(function (obj) {
            let key = obj['point_in_time'];
            if (!(key in objMap)) {
                objMap[key] = []
            }
            objMap[key].push(obj['value']);
        });
        let x = Object.keys(objMap);
        let y = [];
        Object.keys(objMap).forEach(function (key) {
            let avg = objMap[key].reduce((p, c) => Number(p) + Number(c)) / objMap[key].length;
            y.push(avg);
        });
        return [x, y]
    }
    render() {
        const averaged = this.buildLineArray();
        const result = wikiStore.timeSeries.result;
        const params = wikiStore.ui.visualizationParams.getParams(result);

        const Plot = createPlotlyComponent(Plotly);
        return (
            <Plot
                data={[
                    {
                        x: averaged[0],
                        y: averaged[1],
                        mode: 'lines',
                        showlegend: true,
                        line: {
                            dash: params.lineType,
                            width: 4
                        },
                        marker: {
                            color: params.color
                        },
                    },
                ]}
                layout={{ width: 'auto', height: 'auto', title: wikiStore.timeSeries.name }}
            />
        );
    }
}