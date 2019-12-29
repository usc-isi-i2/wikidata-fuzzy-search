import React from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import wikiStore from "./data/store";
//NEW IMPORTS
import { fuzzyRequest } from './services/index';
import * as wikidataQuery from './wikidataQuery';

class App extends React.Component {
    constructor(props: any) {
        super(props);
        this.handleSearch = this.handleSearch.bind(this);
        this.handleSelectedResult = this.handleSelectedResult.bind(this);
        this.state = {
            resultsData: '',
            selectedResult: ''
        }
    }

    handleSearch(keywords: string, country: string) {
        wikiStore.status = 'searching';
        wikiStore.country = country;
        wikiStore.keywords = keywords;
        fuzzyRequest(keywords, country).then(data => {
            wikiStore.status = 'result';
            wikiStore.resultsData = data;
            // update state
            this.setState({
                resultsData: data,
            });
            console.log(wikiStore);
        }).catch(error => {
            wikiStore.status = 'error';
            console.log(error)
        });
    }

    handleSelectedResult(dataset) {
        wikiStore.isPreviewing = true;
        wikiStore.selectedResult = dataset;
        wikiStore.iframeSrc = wikidataQuery.scatterChart(wikiStore.country, dataset);
        wikiStore.iframeView = 'Scatter chart';
        this.setState({
            selectedResult: dataset
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
