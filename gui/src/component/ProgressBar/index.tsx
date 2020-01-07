import React from 'react';
import wikiStore from "../../data/store";
import { observer } from '../../../node_modules/mobx-react';
import BootstrapProgressBar from '../../../node_modules/react-bootstrap/ProgressBar'

@observer
export default class ProgressBar extends React.Component {

    handleLoadingStart() {
        if (wikiStore.ui.isLoading || wikiStore.ui.isSparslLoading) {
            const loadingTimer = window.setInterval(async () => {
                const max = 90, decay = 0.8;
                let now = wikiStore.ui.loadingValue;
                now = max - decay * (max - now);
                wikiStore.ui.loadingValue = now;
                if (!wikiStore.ui.isLoading) {
                    await this.handleLoadingEnd(loadingTimer);
                }
            }, 500);
        }
    }

    handleLoadingEnd(loadingTimer) {
        window.clearInterval(loadingTimer);
        wikiStore.ui.loadingValue = 100;
        window.setTimeout(() => {
            wikiStore.ui.loadingValue = 10;
        }, 4000);
    }

    render() {
        this.handleLoadingStart();
        return (
            <div>
                {wikiStore.ui.isLoading || wikiStore.ui.isSparslLoading ?

                    <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}>
                        <BootstrapProgressBar animated now={100} variant="success" />
                    </div> : ''}
            </div>
        );
    }
}