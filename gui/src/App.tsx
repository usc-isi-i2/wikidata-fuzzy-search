import React, { useDebugValue } from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import wikiStore from "./data/store";
//NEW IMPORTS
import { fuzzyRequest } from './services/index';
import * as wikidataQuery from './wikidataQuery';
import { WikidataTimeSeriesInfo } from './data/types';
import * as wikiQuery from './services/wikiRequest';
import {Region} from './data/types';

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

    handleSearch = async (keywords: string, region: Region) => {
        wikiStore.ui.status = 'searching';
        wikiStore.ui.region = region;
        wikiStore.ui.keywords = keywords;
        try {
            console.log(`country code ${wikiStore.ui.region.countryCode} country name is: ${wikiStore.ui.region.countryName}`);
            const data = await fuzzyRequest(keywords, region.countryCode);
            wikiStore.ui.status = 'result';
            debugger
           
            wikiStore.timeSeries.queriedSeries = data;
            console.log(wikiStore);
        } catch(error) {
            wikiStore.ui.status = 'error';
            console.error(error)
        };
    }

     handleSelectedResult = async(result: WikidataTimeSeriesInfo) => {
        wikiStore.ui.previewOpen = true;
        wikiStore.timeSeries.selectedSeries = result;
        //wikiStore.iframeSrc = wikidataQuery.scatterChart(wikiStore.ui.country, result);
        wikiStore.ui.sparqlStatus = "searching";
        console.log(`country code ${wikiStore.ui.region.countryCode} country name is: ${wikiStore.ui.region.countryName}`);
        wikiStore.timeSeries.timeSeries = await wikiQuery.buildQuery(wikiStore.ui.region.countryCode, result); 
        wikiStore.ui.sparqlStatus = "result";
        //wikiStore.iframeView = 'Scatter chart';
    }

    componentDidUpdate(prevProps: any, prevState: any) {
        console.log("app");
        Object.entries(this.props).forEach(([key, val]) =>
            prevProps[key] !== val && console.log(`Prop '${key}' changed`)
        );
        if (this.state) {
            Object.entries(this.state).forEach(([key, val]) =>
                prevState[key] !== val && console.log(`State '${key}' changed`)
            );
        }
    }

    render() {
        return (
            <div style={{ width: '100vw', height: '100vh' }}>
                <NavBar onSearch={this.handleSearch}></NavBar>
                <Main onSelectedResult={ this.handleSelectedResult }></Main>
            </div>
        );
    }
}

export default App;
