import React from 'react';
import wikiStore from "../../data/store";

import { observer } from 'mobx-react';
import Plotly from "plotly.js-basic-dist";
import createPlotlyComponent from "react-plotly.js/factory";

@observer
export default class ScatterPlot extends React.Component<{}, {}>{

    render() {
        const x_array = wikiStore.timeSeries.timeSeries.map(x =>x.point_in_time);
        const y_array = wikiStore.timeSeries.timeSeries.map(y=> y.value);
        const Plot = createPlotlyComponent(Plotly);
        return (
            <Plot
        data={[
          {
            x: x_array,
            y: y_array,
            type: 'scatter',
            mode: 'markers',
            marker: {color: 'blue'},
          },
        ]}
        layout={ {width:'auto', height: 'auto', title: 'A Fancy Plot'} }
      />
        );
    }
}