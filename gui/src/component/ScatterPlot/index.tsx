import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';

@observer
export default class ScatterPlot extends React.Component<{}, {}>{

  render() {
    const x_array = wikiStore.timeSeries.timeSeriesResult[0].time_points.map(x => x.point_in_time);
    const y_array = wikiStore.timeSeries.timeSeriesResult[0].time_points.map(y => y.value);
    console.log(wikiStore.timeSeries.timeSeriesResult[0].region.countryName)
    const Plot = createPlotlyComponent(Plotly);
    const params = wikiStore.ui.timeSeriesResult.visualiztionParams;
    return (
        <div className='scatter'>
          <Plot
            data={[
              {
                x: x_array,
                y: y_array,
                type: 'scatter',
                mode: wikiStore.timeSeries.timeSeriesResult[0].visualiztionParams.marker,
                name: wikiStore.timeSeries.timeSeriesResult[0].region.countryName,
                showlegend: true,
                marker: { color: wikiStore.timeSeries.timeSeriesResult[0].visualiztionParams.color },
              },
            ]}
            layout={{ width: '100%', height: '100%', title: wikiStore.timeSeries.name }}
          />
        </div>
    );
  }
}