import React from 'react';
import './App.css';
import Main from './component/Main/index';
import NavBar from './component/NavBar/index';
import WikiStore from "./data/store";
//NEW IMPORTS
import {fuzzyRequest} from './services/index';
import * as wikidataQuery from './wikidataQuery';

class App extends React.Component {
  constructor(props:any) {
    super(props);
    this.handleSearch=this.handleSearch.bind(this);
    this.handleSelectedResult=this.handleSelectedResult.bind(this);
    this.state = {
      resultsData: '',
      selectedResult: ''
    }
  }

    handleSearch(keywords:string, country:string ){
    WikiStore.status = 'searching';
    WikiStore.country = country;
    WikiStore.keywords = keywords;
    fuzzyRequest(keywords, country).then(data => {
      WikiStore.status = 'result';
      WikiStore.resultsData = data;
      // update state
    this.setState({
      resultsData: data,
    });
      console.log(WikiStore);
    }).catch(error => {
      WikiStore.status = 'error';
      console.log(error)
    });
  }

  handleSelectedResult(dataset){
    WikiStore.isPreviewing = true;
    WikiStore.selectedResult = dataset;
    WikiStore.iframeSrc = wikidataQuery.scatterChart(WikiStore.country, dataset);
    WikiStore.iframeView = 'Scatter chart';
    this.setState({
      selectedResult: dataset
    });


  }

  componentDidUpdate(prevProps:any, prevState:any) {
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
      <Main onSelectedResult = {(dataset)=> {this.handleSelectedResult(dataset)}}></Main>

      </div>
    );
  }
}

export default App;
