import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';
import { VisualizationParams } from '../../data/visualizations-params';

interface ScatterPlotProperties {
}

@observer
export default class ScatterPlot extends React.Component<ScatterPlotProperties, {}>{

    render() {
        const result = wikiStore.timeSeries.result;
        const x_array = result.points.map(x => x.point_in_time);
        const y_array = result.points.map(y => y.value);
        const Plot = createPlotlyComponent(Plotly);
        const params = wikiStore.ui.visualizationParams.getParams(result);
        
        return (
            <div className='scatter'>
                <Plot
                    data={[
                        {
                            x: x_array,
                            y: y_array,
                            type: 'scatter',
                            mode: 'markers',
                            showlegend: true,
                            marker: { color: params.color, symbol: params.marker },
                        },
                    ]}
                    layout={{ width: '100%', height: '100%', title: wikiStore.timeSeries.name }}
                />
            </div>
        );
    }
}