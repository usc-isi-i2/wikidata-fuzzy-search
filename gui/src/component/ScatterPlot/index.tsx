import React from 'react';
import wikiStore from "../../data/store";

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faExternalLinkSquareAlt, faTable, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

import * as wikidataQuery from '../../wikidataQuery';
import { observer } from 'mobx-react';

@observer
export default class ScatterPlot extends React.Component<{}, {}>{

    render() {
        return (
            <div className="h-100" style={{ overflow: 'hidden' }}>

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