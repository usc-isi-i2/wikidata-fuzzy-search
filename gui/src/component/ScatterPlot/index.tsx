import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";
import './scatterPlot.css';
import GraphKey from '../GraphKey';

@observer
export default class ScatterPlot extends React.Component<{}, {}>{

  render() {
    const x_array = wikiStore.timeSeries.timeSeries.map(x => x.point_in_time);
    const y_array = wikiStore.timeSeries.timeSeries.map(y => y.value);
    const Plot = createPlotlyComponent(Plotly);
    return (
      <div>
        <div className='scatter'>
          <Plot
            data={[
              {
                x: x_array,
                y: y_array,
                type: 'scatter',
                mode: 'markers',
                marker: { color: 'grey' },
              },
            ]}
            layout={{ width: '100%', height: '100%', title: 'Scatter Plot' }}
          />
        </div>
        <GraphKey></GraphKey>
      </div>
    );
  }
}