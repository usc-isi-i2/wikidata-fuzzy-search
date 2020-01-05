import React from 'react';
import wikiStore from "../../data/store";
import BootstrapProgressBar from '../../../node_modules/react-bootstrap/ProgressBar';
import { observer } from '../../../node_modules/mobx-react';
import ProgressBar from '../../../node_modules/react-bootstrap/ProgressBar'

@observer
export default class Progressbar extends React.Component {

    handleLoadingStart() {
        if (wikiStore.ui.isLoading || wikiStore.ui.isSparslLoading) {
            const loadingTimer = window.setInterval(async () => {
                const max = 90, decay = 0.8;
                let now = wikiStore.ui.loadingValue;
                now = max - decay * (max - now);
                wikiStore.ui.loadingValue = now;
                console.log(wikiStore.ui.status);
                if (!wikiStore.ui.isLoading) {
                    await this.handleLoadingEnd(loadingTimer);
                }
            }, 500);
        }
    }

    handleLoadingEnd(loadingTimer) {
        window.clearInterval(loadingTimer);
        wikiStore.ui.loadingValue = 100;
        console.log(wikiStore.ui.loadingValue, "loading");
        window.setTimeout(() => {
            wikiStore.ui.loadingValue = 10;
        }, 4000);
        console.log("done");
    }

    render() {
        this.handleLoadingStart();
        return (
            <div>
                {wikiStore.ui.isLoading || wikiStore.ui.isSparslLoading ?

                    <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}>
                        <ProgressBar animated now={100} variant="success" />
                    </div> : ''}
            </div>
        );
    }
}