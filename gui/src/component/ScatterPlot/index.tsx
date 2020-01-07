import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';

@observer
export default class ScatterPlot extends React.Component<{}, {}>{

  render() {
    const x_array = wikiStore.ui.timeSeriesResult.time_points.map(x => x.point_in_time);
    const y_array = wikiStore.ui.timeSeriesResult.time_points.map(y => y.value);
    const Plot = createPlotlyComponent(Plotly);
    return (
        <div className='scatter'>
          <Plot
            data={[
              {
                x: x_array,
                y: y_array,
                type: 'scatter',
                mode: 'markers',
                name: wikiStore.ui.regionName,
                showlegend: true,
                marker: { color: 'grey' },
              },
            ]}
            layout={{ width: '100%', height: '100%', title: wikiStore.ui.name }}
          />
        </div>
    );
  }
}