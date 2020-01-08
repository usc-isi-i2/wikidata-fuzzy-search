import React, { useDebugValue } from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import wikiStore from "./data/store";
//NEW IMPORTS
import { fuzzyRequest } from './services/index';
import { WikidataTimeSeriesInfo } from './data/types';
import * as wikiQuery from './services/wikiRequest';
import { Region } from './data/types';

interface AppProps {

}

interface AppState {
    resultsData: WikidataTimeSeriesInfo[];
    selectedResult: WikidataTimeSeriesInfo | undefined;
}

class App extends React.Component<AppProps, AppState> {
    constructor(props: any) {
        super(props);
        this.state = {
            resultsData: [] as WikidataTimeSeriesInfo[],
            selectedResult: undefined,
        }
    }

    handleSearch = async (keywords: string, region: Region[]) => {
        wikiStore.ui.status = 'searching';
        wikiStore.ui.region = region;
        wikiStore.ui.keywords = keywords;
        try {
            const data = await fuzzyRequest(keywords, region[0].countryCode);
            wikiStore.ui.status = 'result';
            wikiStore.timeSeries.queriedSeries = data;
        } catch (error) {
            wikiStore.ui.status = 'error';
            console.error(error)
        };
    }

    handleSelectedResult = async (result: WikidataTimeSeriesInfo) => {
        wikiStore.ui.previewOpen = true;
        wikiStore.timeSeries.selectedSeries = result;
        //wikiStore.iframeSrc = wikidataQuery.scatterChart(wikiStore.ui.country, result);
        wikiStore.ui.sparqlStatus = "searching";
        //wikiStore.timeSeries.timeSeries = await wikiQuery.buildQuery(wikiStore.ui.region, result); 
        wikiStore.timeSeries.results = await wikiQuery.buildQuery(wikiStore.ui.region, result);
        console.debug(wikiStore.timeSeries.results[0]);
        wikiStore.ui.sparqlStatus = "result";
        //wikiStore.iframeView = 'Scatter chart';
    }

    render() {
        return (
            <div style={{ width: '100vw', height: '100vh' }}>
                <NavBar onSearch={this.handleSearch}></NavBar>
                <Main onSelectedResult={this.handleSelectedResult}></Main>
            </div>
        );
    }
}

export default App;
