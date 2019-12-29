import React from 'react';
import wikiStore from "../../data/store";

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faExternalLinkSquareAlt, faTable, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

import * as wikidataQuery from '../../wikidataQuery';

export default class Preview extends React.Component<any, any>{
    handleClosePreview() {
        // update state
        wikiStore.isPreviewing = false;
        wikiStore.iframeSrc = '';
        wikiStore.selectedResult = null;
    }

    handleSwitchView(view: any) {
        const { country, selectedResult } = wikiStore;
        switch (view) {
            case 'Table':
                wikiStore.iframeSrc = wikidataQuery.table(country, selectedResult);
                wikiStore.iframeView = 'Table';
                break;
            case 'Scatter chart':
                wikiStore.iframeSrc = wikidataQuery.scatterChart(country, selectedResult); //need to change to table query
                wikiStore.iframeView = 'Scatter chart';
                break;
            default:
                break;
        }
        this.setState({
            selectedResult: view
        });
    }

    render() {
        return (
            <div className="h-100" style={{ overflow: 'hidden' }}>

                {/* buttons */}
                <div title="Close">
                    { /*https://github.com/FortAwesome/react-fontawesome/issues/196*/}
                    <span onClick={() => this.handleClosePreview()} id="preview-close" style={{ margin: '25px' }}>
                        <FontAwesomeIcon className="float-btn" icon={faTimesCircle} />
                    </span>
                </div>
                {(wikiStore.iframeView === 'Table') ?
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
                <iframe
                    title="preview"
                    style={{ border: 'none', width: '100%', height: 'calc(100% - 44px)', marginTop: '44px' }}
                    src={wikiStore.iframeSrc}
                    key={wikiStore.iframeSrc} // used to force re-render this iframe
                    referrerPolicy="origin"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                />

            </div>
        );
    }
}