import React from 'react';
import wikiStore from "../../data/store";
import BootstrapProgressBar from 'react-bootstrap/ProgressBar';
import { observer } from 'mobx-react';

@observer
export default class ProgressBar extends React.Component{

    handleLoadingStart() {
        if(wikiStore.ui.isLoading){
        const loadingTimer = window.setInterval(() => {
          const max = 90, decay = 0.8;
          let now = wikiStore.ui.loadingValue;
          now = max - decay * (max - now);
          wikiStore.ui.loadingValue = now;
          console.log(wikiStore.ui.status);
          if(wikiStore.ui.status == 'result'){
            this.handleLoadingEnd(loadingTimer);
        }
        }, 200);
        
    }
      }

      handleLoadingEnd(loadingTimer) {
        window.clearInterval(loadingTimer);
        wikiStore.ui.loadingValue=100;
        window.setTimeout(() => {
            wikiStore.ui.loadingValue = 10;
        }, 400);
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