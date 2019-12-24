import React from 'react';
import './App.css';
import NavBar from './component/NavBar/index';

//NEW IMPORTS
import {fuzzyRequest} from './services/index';

class App extends React.Component {
  constructor(props:any) {
    super(props);
  }
  handleSearchapp(keywords:string, country:string ){
    let result = fuzzyRequest(keywords, country).then(data => {debugger})
    debugger

    let c=4;
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
      <div>
      <NavBar onSearch={this.handleSearchapp}></NavBar>

      </div>
    );
  }
}

export default App;
