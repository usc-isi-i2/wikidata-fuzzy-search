import React from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import wikiStore from "./data/store";
import { WikidataTimeSeriesInfo } from './data/types';
import { Region } from './data/types';
import { queryKeywords } from './queries/keyword-queries'
import { queryTimeSeries } from './queries/timeseries-queries';
import { ScatterGroupingParams } from './customizations/visualizations-params';

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
    clearData(){
        wikiStore.timeSeries.queriedSeries = [];
        wikiStore.timeSeries.result = undefined;
        wikiStore.timeSeries.selectedSeries = undefined;
        wikiStore.ui.previewOpen = false;
        wikiStore.ui.customiztionsCache.clearCache();
    }

    handleSearch = async (keywords: string, region: Region[]) => {
        console.debug(`handleSearch with ${keywords} and region ${region}`)
        wikiStore.ui.status = 'searching';
        wikiStore.ui.region = region;
        wikiStore.ui.keywords = keywords;
        this.clearData()
        try {
            const data = await queryKeywords(keywords, region[0].countryCode);
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
        wikiStore.ui.scatterGroupingParams.markerSize = wikiStore.ui.scatterGroupingParams.markerSize? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.markerSize.name): undefined;
        wikiStore.ui.scatterGroupingParams.markerSymbol = wikiStore.ui.scatterGroupingParams.markerSymbol? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.markerSymbol.name): undefined;
        wikiStore.ui.scatterGroupingParams.color = wikiStore.ui.scatterGroupingParams.color? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.color.name): undefined;
        wikiStore.ui.scatterGroupingParams.colorLevel = wikiStore.ui.scatterGroupingParams.colorLevel? wikiStore.timeSeries.result.columns.find(c => c.name === wikiStore.ui.scatterGroupingParams.colorLevel.name): undefined;
        
        if (!(wikiStore.ui.scatterGroupingParams.color || wikiStore.ui.scatterGroupingParams.markerSize || wikiStore.ui.scatterGroupingParams.markerSymbol)){
            wikiStore.ui.scatterGroupingParams = new ScatterGroupingParams(countryColumn);
        }
        
    }

    handleSelectedResult = async (result: WikidataTimeSeriesInfo) => {
        wikiStore.ui.previewOpen = true;
        wikiStore.timeSeries.selectedSeries = result;
        //wikiStore.iframeSrc = wikidataQuery.scatterChart(wikiStore.ui.country, result);
        wikiStore.ui.sparqlStatus = "searching";
        //wikiStore.timeSeries.timeSeries = await wikiQuery.buildQuery(wikiStore.ui.region, result); 
        wikiStore.timeSeries.result = await queryTimeSeries(result, wikiStore.ui.region);
        this.setDefaultGrouping();

        console.debug('App handleSelectedResult color grouping: ', wikiStore.ui.scatterGroupingParams.color?.name ?? 'undefined');

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
