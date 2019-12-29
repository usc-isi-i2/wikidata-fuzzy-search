import React from 'react';
import wikiStore from "../../data/store";
import BootstrapProgressBar from 'react-bootstrap/ProgressBar';

export default class ProgressBarComponent extends React.Component<any, any>{
    render() {
        return (
            <div>
                {wikiStore.isLoading ? <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}><BootstrapProgressBar animated variant="success" now={wikiStore.loadingValue} /></div> : ''}
            </div>
        );
    }
}