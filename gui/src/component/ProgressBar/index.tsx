import React from 'react';
import wikiStore from "../../data/store";
import BootstrapProgressBar from 'react-bootstrap/ProgressBar';
import { observer } from 'mobx-react';

@observer
export default class ProgressBar extends React.Component{
    render() {
        return (
            <div>
                {wikiStore.ui.isLoading ? <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}><BootstrapProgressBar animated variant="success" now={wikiStore.ui.loadingValue} /></div> : ''}
            </div>
        );
    }
}