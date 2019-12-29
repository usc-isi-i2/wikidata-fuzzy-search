import React from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import wikiStore from "./data/store";
//NEW IMPORTS
import { fuzzyRequest } from './services/index';
import * as wikidataQuery from './wikidataQuery';
import { WikidataTimeSeriesInfo } from './data/time-series-info';

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

    handleSearch = async (keywords: string, country: string) => {
        wikiStore.ui.status = 'searching';
        wikiStore.ui.country = country;
        wikiStore.ui.keywords = keywords;
        try {
            const data = await fuzzyRequest(keywords, country);
            wikiStore.ui.status = 'result';
            wikiStore.timeSeries.queriedSeries = data;
            // update state
            this.setState({
                resultsData: data,
            });
            console.log(wikiStore);
        } catch(error) {
            wikiStore.ui.status = 'error';
            console.error(error)
        };
    }

    handleSelectedResult = (result: WikidataTimeSeriesInfo) => {
        wikiStore.ui.isPreviewing = true;
        wikiStore.timeSeries.selectedSeries = result;
        wikiStore.iframeSrc = wikidataQuery.scatterChart(wikiStore.ui.country, result);
        wikiStore.iframeView = 'Scatter chart';
        this.setState({
            selectedResult: result,
        });
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
