import React from 'react';
import wikiStore from "../../data/store";
import BootstrapProgressBar from 'react-bootstrap/ProgressBar';
import { observer } from 'mobx-react';

@observer
export default class ProgressBar extends React.Component{

    handleLoadingStart() {
        if(wikiStore.ui.isLoading){
        const loadingTimer = window.setInterval(async () => {
          const max = 100, decay = 0.8;
          let now = wikiStore.ui.loadingValue;
          now = max - decay * (max - now);
          wikiStore.ui.loadingValue = now;
          console.log(wikiStore.ui.status);
          if(!wikiStore.ui.isLoading){
            await this.handleLoadingEnd(loadingTimer);
        }
        }, 500);
    }
      }

      handleLoadingEnd(loadingTimer) {
        window.clearInterval(loadingTimer);
        debugger
        wikiStore.ui.loadingValue=100;
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
                {wikiStore.ui.isLoading ? 
                <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}>
                    <BootstrapProgressBar animated variant="success" now={wikiStore.ui.loadingValue} /></div> : ''}
            </div>
        );
    }
}