import React from 'react';
import wikiStore from "../../data/store";
import BootstrapProgressBar from 'react-bootstrap/ProgressBar';

export default class ProgressBar extends React.Component{
    render() {
        return (
            <div>
                {wikiStore.isLoading ? <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}><BootstrapProgressBar animated variant="success" now={wikiStore.loadingValue} /></div> : ''}
            </div>
        );
    }
}