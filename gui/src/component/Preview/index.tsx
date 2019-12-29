import React from 'react';
import WikiStore from "../../data/store";

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faExternalLinkSquareAlt, faTable, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

import * as wikidataQuery from '../../wikidataQuery';

export default class Preview extends React.Component<any, any>{
    handleClosePreview() {
        // update state
        WikiStore.isPreviewing = false;
        WikiStore.iframeSrc = '';
        WikiStore.selectedResult = null;
    }

    handleSwitchView(view: any) {
        const { country, selectedResult } = WikiStore;
        switch (view) {
            case 'Table':
                WikiStore.iframeSrc = wikidataQuery.table(country, selectedResult);
                WikiStore.iframeView = 'Table';
                break;
            case 'Scatter chart':
                WikiStore.iframeSrc = wikidataQuery.scatterChart(country, selectedResult); //need to change to table query
                WikiStore.iframeView = 'Scatter chart';
                break;
            default:
                break;
        }
        this.setState({
            selectedResult: view
        });
    }

    render() {
        debugger
        return (
            <div className="h-100" style={{ overflow: 'hidden' }}>

                {/* buttons */}
                <div title="Close">
                    { /*https://github.com/FortAwesome/react-fontawesome/issues/196*/}
                    <span onClick={() => this.handleClosePreview()} id="preview-close" style={{ margin: '25px' }}>
                        <FontAwesomeIcon className="float-btn" icon={faTimesCircle} />
                    </span>
                </div>
                {(WikiStore.iframeView === 'Table') ?
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
                <a title="Open in new tab" href={WikiStore.iframeSrc} target="_blank" rel="noopener noreferrer">
                    <span id="preview-open" style={{ margin: '25px' }}>
                        <FontAwesomeIcon className="float-btn" icon={faExternalLinkSquareAlt} />
                    </span>
                </a>

                {/* iframe */}
                <iframe
                    title="preview"
                    style={{ border: 'none', width: '100%', height: 'calc(100% - 44px)', marginTop: '44px' }}
                    src={WikiStore.iframeSrc}
                    key={WikiStore.iframeSrc} // used to force re-render this iframe
                    referrerPolicy="origin"
                    sandbox="allow-scripts allow-same-origin allow-popups"
                />

            </div>
        );
    }
}