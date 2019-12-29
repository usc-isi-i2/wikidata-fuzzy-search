import React from 'react';
import WikiStore from "../../data/store";
import ProgressBar from '../../../node_modules/react-bootstrap/ProgressBar';

export default class Progressbar extends React.Component<any, any>{
    render() {
        return (
            <div>
                {WikiStore.isLoading ? <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}><ProgressBar animated variant="success" now={WikiStore.loadingValue} /></div> : ''}
            </div>

        );
    }
}