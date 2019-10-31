import React from 'react';
import './App.css';

// Local
import config from './config/config'
import countryOptions from './config/countryOptions'
// import sampleResponse from './config/sampleResponse'
import * as utils from './utils'
import * as wikidataQuery from './wikidataQuery'

// Bootstrap
// import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import InputGroup from 'react-bootstrap/InputGroup'
import Navbar from 'react-bootstrap/Navbar'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Row from 'react-bootstrap/Row'

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faExternalLinkSquareAlt, faChartBar, faSearch, faTable, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

// Select
import Select from 'react-select';

class App extends React.Component {
  constructor(props) {
    super(props);

    // init state
    this.state = {

      // appearance
      isPreviewing: false,
      isLoading: false,
      loadingValue: 10,

      // query
      keywords: '',
      country: 'Q30',

      // result
      // keywordData: {}, // { 'homicide': true, 'mismatched1': false, 'mismatched2': false, 'homicides': true, 'murder': true, 'homocide': true, 'murders': true, 'slaying': true, 'fatality': true, 'crime': true, 'arson': true, 'killings': true },
      resultsData: [],
      // resultsData: utils.getResultsData(sampleResponse),
      selectedResult: null,
      iframeSrc: '',
      iframeView: 'Scatter chart',

    }
  }

  handleClickResult(dataset) {
    console.log('<App> selected pnode: %c' + dataset.name, utils.log.highlight);
    const { country } = this.state;

    // update state
    this.setState({
      isPreviewing: true,
      selectedResult: dataset,
      iframeSrc: wikidataQuery.scatterChart(country, dataset),
      iframeView: 'Scatter chart',
    });
  }

  handleClosePreview() {

    // update state
    this.setState({
      isPreviewing: false,
      selectedResult: null,
      iframeSrc: '',
    });
  }

  handleLoadingStart() {
    const loadingTimer = window.setInterval(() => {
      const max = 90, decay = 0.8;
      let now = this.state.loadingValue;
      now = max - decay * (max - now);
      this.setState({ loadingValue: now });
    }, 200);
    this.setState({ isLoading: true });
    return loadingTimer;
  }

  handleLoadingEnd(loadingTimer) {
    window.clearInterval(loadingTimer);
    this.setState({ loadingValue: 100 });
    window.setTimeout(() => {
      this.setState({ isLoading: false, loadingValue: 10 });
    }, 400);
  }

  handleSearch() {
    const keywords = this.refs.inputKeywords.value.trim();
    const { country } = this.state;

    // before rendering search result
    document.title = keywords + ' - Fuzzy Search'; // update page title
    const loadingTimer = this.handleLoadingStart();

    // send request to get search result
    console.log('<App> -> %c/linking/wikidata%c?keywords=%c' + keywords + '%c&country=%c' + country, utils.log.link, utils.log.default, utils.log.highlight, utils.log.default, utils.log.highlight);
    fetch(config.server + '/linking/wikidata?keywords=' + keywords + '&country=' + country, {
      method: 'get',
      mode: 'cors',
    }).then(response => {
      if (!response.ok) throw Error(response.statusText);
      return response;
    }).then(response => {
      return response.json();
    }).then(json => {
      console.log('<App> <- %c/linking/wikidata%c with search result:', utils.log.link, utils.log.default);
      console.log(json);

      // error handling
      // TODO

      // update state
      const resultsData = utils.getResultsData(json);
      this.setState({
        keywords: keywords,
        resultsData: resultsData,
      });
      this.handleLoadingEnd(loadingTimer);

      // preview same pnode if exists
      const { selectedResult } = this.state;
      if (selectedResult !== null) {
        const resultName = selectedResult.name;
        let hasResultName = false;
        for (let i = 0; i < resultsData.length; i++) {
          if (resultsData[i].name === resultName) {
            this.handleClickResult(resultsData[i]);
            hasResultName = true;
            break;
          }
        }
        if (hasResultName) {
          // console.log('<App> found same pnode');
        } else {
          console.log('<App> cannot found pnode: %c' + resultName, utils.log.highlight);
          this.setState({
            isPreviewing: false,
            selectedResult: null,
            iframeSrc: '',
            iframeView: 'Scatter chart',
          });
        }
      }

    }).catch((error) => {
      console.log(error);

      // error handling
      alert(error);
      this.handleLoadingEnd(loadingTimer);
    });
  }

  handleSwitchCountry(selectedOption) {
    console.log('<App> selected country: %c' + selectedOption.value + '%c ' + selectedOption.label, utils.log.highlight, utils.log.default);

    this.setState({ country: selectedOption.value });

    // if (this.state.keywords !== '') this.handleSearch(); // auto search
  }

  handleSwitchView(view) {
    const { country, selectedResult } = this.state;
    switch (view) {
      case 'Table':
        this.setState({
          iframeSrc: wikidataQuery.table(country, selectedResult),
          iframeView: 'Table',
        });
        break;
      case 'Scatter chart':
        this.setState({
          iframeSrc: wikidataQuery.scatterChart(country, selectedResult),
          iframeView: 'Scatter chart',
        });
        break;
      default:
        break;
    }
  }

  // handleToggleKeyword(keyword) {
  //   let { keywordData } = this.state;
  //   keywordData[keyword] = !keywordData[keyword];
  //   this.setState({ keywordData: keywordData });
  //   // TODO: update filter
  // }

  renderDatasets() {
    const { isPreviewing, resultsData, selectedResult } = this.state;

    let resultsHtml = [];
    for (let i = 0; i < resultsData.length; i++) {
      const { name, label, description, qualifiers, score } = resultsData[i];

      let qualifiersHtml = [];
      const qualifierNames = Object.keys(qualifiers);
      for (let j = 0; j < qualifierNames.length; j++) {
        if (j > 0) qualifiersHtml.push(<br key={'br' + j} />);
        const qualifierName = qualifierNames[j];
        const qualifierLabel = qualifiers[qualifierName];
        qualifiersHtml.push(
          // <span key={j} title={'' + label + ': ' + utils.truncateQualifiers(values, false)}>
          //   {'- ' + label + ': ' + utils.truncateQualifiers(values, true)}
          // </span>
          <span key={j}>
            {'- ' + qualifierLabel + ' (' + qualifierName + ')'}
          </span>
        );
      }

      resultsHtml.push(
        <Col
          xs={isPreviewing ? 12 : 12}
          sm={isPreviewing ? 12 : 12}
          md={isPreviewing ? 12 : 6}
          lg={isPreviewing ? 12 : 6}
          xl={isPreviewing ? 6 : 3}
          key={i}
          className="p-2"
        >
          <Card
            className="shadow-sm h-100"
            border={(selectedResult !== null && name === selectedResult.name) ? 'primary' : ''}
            style={(selectedResult !== null && name === selectedResult.name) ? { cursor: 'pointer', background: 'aliceblue' } : { cursor: 'pointer', background: '#f8f9fa' }}
            onClick={() => this.handleClickResult(resultsData[i])}
          >

            {/* header */}
            <Card.Header className="pl-3 pr-3 pt-2 pb-2" style={{ fontSize: 'small' }}>

              {/* label */}
              <span className="text-danger" style={{ display: 'none' }}>{'[' + score.toFixed(2) + '] '}</span>
              <span className="font-weight-bold" style={{ color: '#1990d5' }} title={label}>{utils.truncateStr(label, 30)}</span>
              <span>{' '}</span>
              <span className="text-muted">({name})</span>

            </Card.Header>

            {/* body */}
            <Card.Body className="pl-3 pr-3 pt-2 pb-2" style={{ display: 'flex', flexDirection: 'column' }}>

              {/* description */}
              <Card.Text title={description} style={{ fontSize: 'small', flex: '1' }}>
                {utils.truncateStr(description, 140)}
              </Card.Text>

              {/* qualifiers */}
              <Card.Text className="text-muted" style={{ fontSize: 'small' }}>
                {qualifiersHtml}
              </Card.Text>

            </Card.Body>

          </Card>
        </Col>
      );
    }

    return (
      <Row
        className="pt-2"
      // style={{ paddingTop: '32px' }}
      >
        {resultsHtml}
      </Row>
    );
  }

  renderPreview() {
    const { iframeSrc, iframeView } = this.state;

    return (
      <div className="h-100" style={{ overflow: 'hidden' }}>

        {/* buttons */}
        <div title="Close">
          <FontAwesomeIcon className="float-btn" icon={faTimesCircle} id="preview-close" onClick={() => this.handleClosePreview()} />
        </div>
        {(iframeView === 'Table') ?
          <div title="Show scatter chart">
            <FontAwesomeIcon className="float-btn" icon={faChartBar} id="preview-scatter" onClick={() => this.handleSwitchView('Scatter chart')} />
          </div> :
          <div title="Show table">
            <FontAwesomeIcon className="float-btn" icon={faTable} id="preview-table" onClick={() => this.handleSwitchView('Table')} />
          </div>
        }
        <a title="Open in new tab" href={iframeSrc} target="_blank" rel="noopener noreferrer">
          <FontAwesomeIcon className="float-btn" icon={faExternalLinkSquareAlt} id="preview-open" />
        </a>

        {/* iframe */}
        <iframe
          title="preview"
          style={{ border: 'none', width: '100%', height: 'calc(100% - 44px)', marginTop: '44px' }}
          src={iframeSrc}
          key={iframeSrc} // used to force re-render this iframe
          referrerPolicy="origin"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />

      </div>
    );
  }

  renderSearchBox() {

    const customStyles = {
      option: (provided, state) => ({
        ...provided,
      }),
      control: (provided) => ({
        ...provided,
        borderRadius: '0px',
      }),
      singleValue: (provided, state) => {
        const opacity = state.isDisabled ? 0.5 : 1;
        const transition = 'opacity 300ms';
        return { ...provided, opacity, transition };
      }
    }

    return (
      <Form
        inline
        className="shadow-sm"
        onSubmit={(event) => {
          event.preventDefault();
          this.handleSearch();
        }}
      >
        <InputGroup>
          <FormControl
            style={{ minWidth: '50px', width: '20vw', maxWidth: '300px', borderRight: 'none' }}
            ref="inputKeywords"
            placeholder="Enter query..."
            autoFocus
            required
          />
          <div style={{ minWidth: '50px', width: '20vw', maxWidth: '300px' }}>
            <Select
              styles={customStyles}
              options={countryOptions}
              defaultValue={{ 'label': 'United States of America', 'value': 'Q30' }}
              onChange={(selectedOption) => this.handleSwitchCountry(selectedOption)}
            />
          </div>
          <InputGroup.Append>
            <Button type="submit" variant="primary" title="Search" style={{ background: '#006699', border: '0' }}>
              <FontAwesomeIcon icon={faSearch} />
            </Button>
          </InputGroup.Append>
        </InputGroup>
      </Form>
    );
  }

  // renderFilters() {
  //   const { isPreviewing, keywordData } = this.state;
  //   const keywords = Object.keys(keywordData);
  //   if (keywords.length === 0) return;

  //   let keywordsHtml = [];
  //   for (let i = 0; i < keywords.length; i++) {
  //     keywordsHtml.push(
  //       <Badge
  //         key={i}
  //         pill
  //         className={keywordData[keywords[i]] ? 'filter-selected mr-1' : 'filter-unselected mr-1'}
  //         style={{ fontWeight: 'normal' }}
  //         onClick={() => this.handleToggleKeyword(keywords[i])}>
  //         {keywords[i]}
  //       </Badge>
  //     );
  //   }
  //   return (
  //     <div
  //       className={isPreviewing ? 'w-50' : 'w-100'}
  //       style={{ position: 'absolute', height: '28px', zIndex: '400', background: 'white', borderBottom: '1px solid #76a746' }}
  //     >
  //       <div className="text-muted pl-2" style={{ position: 'absolute', top: '4px', left: '0', width: '72px', height: '20px', fontSize: 'small' }}>
  //         Result&nbsp;for:&nbsp;
  //       </div>
  //       <div id="keywords" style={{ position: 'absolute', top: '0', left: '72px', width: 'calc(100% - 72px)', whiteSpace: 'nowrap', overflowX: 'auto' }}>
  //         {keywordsHtml}
  //       </div>
  //     </div>
  //   );
  // }

  render() {
    const { isPreviewing, isLoading, loadingValue } = this.state;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>

        {/* navbar */}
        <Navbar bg="light" style={{ height: '70px', borderBottom: '1px solid #1990d5', zIndex: '1000' }} className="shadow">

          {/* logo */}
          {/* <Navbar.Brand title="" href="" target="_blank" rel="noopener noreferrer">
            <img src="favicon.ico" width="40" height="40" className="d-inline-block" alt="" />
          </Navbar.Brand> */}
          <Navbar.Brand className="responsive-hide" style={{ fontSize: 'x-large', fontWeight: 'bold', fontFamily: '"Roboto Slab", serif', cursor: 'default' }}>
            {'Time Series Fuzzy Search'}
          </Navbar.Brand>

          {/* search box */}
          {this.renderSearchBox()}

        </Navbar>

        {/* content */}
        <Container fluid className="p-0" style={{ overflow: 'hidden', height: 'calc(100vh - 70px)' }}>

          {/* loading */}
          {isLoading ? <div className="loading" style={{ zIndex: '750', background: 'rgba(0, 0, 0, 0.1)' }}><ProgressBar animated variant="success" now={loadingValue} /></div> : ''}

          {/* filters */}
          {/* {this.renderFilters()} */}

          <Row className="h-100 m-0">

            {/* resultsData */}
            <Col
              xs={isPreviewing ? 6 : 12}
              md={isPreviewing ? 6 : 12}
              xl={isPreviewing ? 6 : 12}
              style={{ height: '100%', overflow: 'auto' }}
            >
              {this.renderDatasets()}
            </Col>

            {/* preview */}
            <Col
              xs={isPreviewing ? 6 : 0}
              md={isPreviewing ? 6 : 0}
              xl={isPreviewing ? 6 : 0}
              className="shadow p-0"
              style={{ height: '100%', overflow: 'auto', borderLeft: '1px solid #1990d5', zIndex: '500' }}
            >
              {isPreviewing ? this.renderPreview() : ''}
            </Col>

          </Row>
        </Container>

      </div>
    );
  }
}

export default App;
