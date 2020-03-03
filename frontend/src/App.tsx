import React from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import wikiStore from "./data/store";
import { WikidataTimeSeriesInfo } from './data/types';
import { queryKeywords } from './queries/keyword-queries'
import { queryTimeSeries } from './queries/timeseries-queries';
import { ScatterGroupingParams } from './customizations/visualizations-params';
import { Region } from './regions/types';

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
    clearData() {
        wikiStore.timeSeries.queriedSeries = [];
        wikiStore.timeSeries.result = undefined;
        wikiStore.timeSeries.selectedSeries = undefined;
        wikiStore.ui.previewOpen = false;
        wikiStore.ui.customiztionsCache.clearCustomiztionsCache();
    }
    handleSearch = async (keywords: string) => {
        console.debug(`handleSearch with ${keywords} and region ${wikiStore.ui.selectedRegions}`)
        wikiStore.ui.status = 'searching';
        //wikiStore.ui.selectedRegions = region;
        wikiStore.ui.keywords = keywords;
        this.clearData()
        try {
            const data = await queryKeywords(keywords, wikiStore.ui.selectedRegions[0].qCode);
            wikiStore.ui.status = 'result';
            wikiStore.timeSeries.queriedSeries = data;
        } catch (error) {
            wikiStore.ui.status = 'error';
            console.error(error)
        };
    }

    setDefaultGrouping = () => {
        // Default: different color for each country
        const countryColumn = wikiStore.timeSeries.result.columns.find(c => c.name === 'countryLabel');
        //check if there is already data about the group
        wikiStore.ui.scatterGroupingParams.markerSize = wikiStore.ui.scatterGroupingParams.markerSize ? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.markerSize.name) : undefined;
        wikiStore.ui.scatterGroupingParams.markerSymbol = wikiStore.ui.scatterGroupingParams.markerSymbol ? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.markerSymbol.name) : undefined;
        wikiStore.ui.scatterGroupingParams.color = wikiStore.ui.scatterGroupingParams.color ? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.color.name) : undefined;
        wikiStore.ui.scatterGroupingParams.colorLevel = wikiStore.ui.scatterGroupingParams.colorLevel ? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.colorLevel.name) : undefined;

        if (!(wikiStore.ui.scatterGroupingParams.color || wikiStore.ui.scatterGroupingParams.markerSize || wikiStore.ui.scatterGroupingParams.markerSymbol)) {
            wikiStore.ui.scatterGroupingParams = new ScatterGroupingParams(countryColumn);
        }

    }

    handleRegion= (region: Region[]) => {
        wikiStore.ui.selectedRegions = region;
        if(wikiStore.timeSeries.selectedSeries){
            this.updateResults();
        }
    }
    // clearScatterGroupingParams(){
    //     wikiStore.ui.scatterGroupingParams.color = undefined;
    //     wikiStore.ui.scatterGroupingParams.colorLevel = undefined;
    //     wikiStore.ui.scatterGroupingParams.markerSize = undefined;
    //     wikiStore.ui.scatterGroupingParams.markerSymbol = undefined;
    // }
    
    updateResults = async () => {
        wikiStore.ui.sparqlStatus = "searching";
        wikiStore.timeSeries.result = await queryTimeSeries(wikiStore.timeSeries.selectedSeries, wikiStore.ui.selectedRegions);
        // this.clearScatterGroupingParams();
        this.setDefaultGrouping();
        console.debug('App handleSelectedResult color grouping: ', wikiStore.ui.scatterGroupingParams.color?.name ?? 'undefined');

        wikiStore.ui.sparqlStatus = "result";
    }

    handleSelectedResult = async (result: WikidataTimeSeriesInfo) => {
        wikiStore.ui.previewOpen = true;
        wikiStore.timeSeries.selectedSeries = result;
        this.updateResults();
    }

    render() {
        return (
            <div style={{ width: '100vw', height: '100vh' }}>
                <NavBar onSearch={this.handleSearch} onRegionChanged= {this.handleRegion}></NavBar>
                <Main onSelectedResult={this.handleSelectedResult}></Main>
            </div>
        );
    }
}

export default App;
