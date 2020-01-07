import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';

@observer
export default class ScatterPlot extends React.Component<{}, {}>{

    render() {
        const result = wikiStore.timeSeries.timeSeriesResult[0];
        const x_array = result.time_points.map(x => x.point_in_time);
        const y_array = result.time_points.map(y => y.value);
        const Plot = createPlotlyComponent(Plotly);
        const params = result.visualiztionParams;
        return (
            <div className='scatter'>
                <Plot
                    data={[
                        {
                            x: x_array,
                            y: y_array,
                            type: 'scatter',
                            mode: 'markers',
                            name: result.region.name,
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