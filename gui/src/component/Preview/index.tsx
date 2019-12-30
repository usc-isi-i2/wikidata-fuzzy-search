import React from 'react';
import wikiStore from "../../data/store";
import ScatterPlot from '../ScatterPlot';
import Table from '../Table';
import * as wikiQuery from '../../services/wikiRequest';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faExternalLinkSquareAlt, faTable, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

import * as wikidataQuery from '../../wikidataQuery';
import { observer } from 'mobx-react';

@observer
export default class Preview extends React.Component<{}, {}>{
    handleClosePreview = () => {
        // update state
        wikiStore.iframeSrc = '';
        wikiStore.timeSeries.selectedSeries = null;
        wikiStore.ui.previewOpen = false;
        wikiStore.timeSeries.timeSeries = null;
    }

    handleSwitchView = async(view: any) => {
        const country = wikiStore.ui.country;
        const selectedResult = wikiStore.timeSeries.selectedSeries;
        wikiStore.timeSeries.timeSeries = await wikiQuery.buildQuery(wikiStore.ui.country, selectedResult); 
        switch (view) {
            case 'Table':
                wikiStore.iframeSrc = wikidataQuery.table(country, selectedResult);
                wikiStore.ui.previewType = "table";
                break;
            case 'Scatter chart':
                wikiStore.iframeSrc = wikidataQuery.scatterChart(country, selectedResult); //need to change to table query
                wikiStore.ui.previewType= 'scatter-plot';
                break;
            default:
                break;
        }
    }

    render() {
        let previewWidget: JSX.Element;
        if (wikiStore.ui.previewType =='scatter-plot') {
            previewWidget = <ScatterPlot></ScatterPlot>;
        } else if (wikiStore.ui.previewType == 'table') {
            previewWidget = <Table></Table>;
        }

        return (
            <div className="h-100" style={{ overflow: 'hidden' }}>
                {/* buttons */}
                <div title="Close">
                    { /*https://github.com/FortAwesome/react-fontawesome/issues/196*/}
                    <span onClick={ this.handleClosePreview } id="preview-close" style={{ margin: '25px' }}>
                        <FontAwesomeIcon className="float-btn" icon={faTimesCircle} />
                    </span>
                </div>
                {(wikiStore.ui.previewType === 'table') ?
                    <div title="Show scatter chart">
                        <span id="preview-scatter" onClick={() => this.handleSwitchView('Scatter chart')} style={{ margin: '25px' }}>
                            <FontAwesomeIcon className="float-btn" icon={faChartBar} />
                        </span>
                    </div> :
                    <span onClick={() => this.handleSwitchView('Table')} style={{ margin: '25px' }} >
                        <div title="Show table">
                            <FontAwesomeIcon className="float-btn" icon={faTable} />
                        </div>
                    </span>
                }
                <a title="Open in new tab" href={wikiStore.iframeSrc} target="_blank" rel="noopener noreferrer">
                    <span id="preview-open" style={{ margin: '25px' }}>
                        <FontAwesomeIcon className="float-btn" icon={faExternalLinkSquareAlt} />
                    </span>
                </a>

                {/* iframe */}
                { previewWidget }
            </div>
        );
    }
}