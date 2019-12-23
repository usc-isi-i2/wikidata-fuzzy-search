import React from 'react';
import './App.css';

// Local
import config from './config/config.json'
import countryOptions from './config/countryOptions.json'
// import sampleResponse from './config/sampleResponse'
import * as utils from './utils'
import * as wikidataQuery from './wikidataQuery'

// Bootstrap
import Badge from 'react-bootstrap/Badge'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Container from 'react-bootstrap/Container'
import Form from 'react-bootstrap/Form'
import FormControl from 'react-bootstrap/FormControl'
import InputGroup from 'react-bootstrap/InputGroup'
import NavBar from './component/NavBar/index';
import ProgressBar from 'react-bootstrap/ProgressBar'
import Row from 'react-bootstrap/Row'

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faExternalLinkSquareAlt, faSearch, faTable, faTimesCircle } from '@fortawesome/free-solid-svg-icons'

// Select
import Select from 'react-select';

//NEW IMPORTS
import {queryRequest} from './services/index';

class App extends React.Component {
  constructor(props) {
    super(props);

    // init state
    this.state = {

      // appearance
      isDebugging: config.isDebugging,
      isPreviewing: false,
      isLoading: false,
      loadingValue: 10,

      // query
      keywords: '',
      country: 'Q30',

      // result
      resultsData: [],
      // resultsData: utils.getResultsData(sampleResponse),
      selectedResult: null,
      iframeSrc: '',
      iframeView: 'Scatter chart',

    }
  }

  componentDidMount() {
    // do search if params are given
    if (document.location.search !== '') {
      const params = new URLSearchParams(document.location.search.substring(1));
      const keywords = params.get('q');
      if (keywords !== null) {
        this.refs.inputKeywords.value = keywords;
        this.handleSearch();
      }
    }

    // add popstate listener
    window.addEventListener("popstate", (event) => this.handleSearch(event));
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

  handleLoadingEnd(loadingTimer) {
    window.clearInterval(loadingTimer);
    this.setState({ loadingValue: 100 });
    window.setTimeout(() => {
      this.setState({ isLoading: false, loadingValue: 10 });
    }, 400);
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

  handleSearch(event = null) {
    let keywords, country;
    if (event === null) {
      // func called by search button
      keywords = this.refs.inputKeywords.value.trim();
      country = this.state.country;

      // magic code
      if (keywords === '--debug') {
        const { isDebugging, keywords } = this.state;
        this.setState({ isDebugging: !isDebugging });
        this.refs.inputKeywords.value = keywords;
        return;
      }

      // update history
      const data = { q: keywords }
      const title = keywords + ' - Fuzzy Search'
      const url = '?' + Object.entries(data).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
      document.title = title;
      window.history.pushState(data, title, url);
    } else {
      // func called by browser (back/forward button)
      if (!event.state) return;
      keywords = event.state['q'];
      if (!keywords) return;
      this.refs.inputKeywords.value = keywords;
      country = this.state.country;

      // don't update history
      const title = keywords + ' - Fuzzy Search'
      document.title = title;
    }

    // before rendering search result
    const loadingTimer = this.handleLoadingStart();

    // send request to get search result
    console.log('<App> -> %c/linking/wikidata%c?keywords=%c' + keywords + '%c&country=%c' + country, utils.log.link, utils.log.default, utils.log.highlight, utils.log.default, utils.log.highlight);
    fetch(config.backendServer + '/linking/wikidata?keywords=' + keywords + '&country=' + country, {
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
      // alert(error);
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

  renderDatasets() {
    const { isDebugging, isPreviewing, resultsData, selectedResult } = this.state;

    let resultsHtml = [];
    for (let i = 0; i < resultsData.length; i++) {
      const { name, label, description, qualifiers, statistics, score } = resultsData[i];

      let qualifiersHtml = [];
      const qualifierNames = Object.keys(qualifiers);
      if (!isDebugging && qualifierNames.length === 0) continue; // remove result with no qualifier

      for (let j = 0; j < qualifierNames.length; j++) {
        if (j === 0) {
          qualifiersHtml.push(<span key="qualifiers">{'- Columns:'}</span>);
          qualifiersHtml.push(<br key={'br' + j} />);
        } else {
          qualifiersHtml.push(<br key={'br' + j} />);
        }
        const qualifierName = qualifierNames[j];
        const qualifierLabel = qualifiers[qualifierName];
        qualifiersHtml.push(
          <span key={j}>
            &nbsp;&nbsp;&nbsp;&nbsp;{'- ' + qualifierLabel + ' (' + qualifierName + ')'}
          </span>
        );
      }

      let statisticsHtml = [];
      if (statistics !== undefined && statistics !== null) {
        const { min_time, max_time, count, max_precision } = statistics;
        statisticsHtml.push(
          <span key={'statistics' + i}>
            <span key={'statistics' + i}>
              <span>{'- Time range: '}</span>
              <Badge variant="success">{utils.formatTime(min_time, max_precision)}</Badge>
              {' - '}
              <Badge variant="success">{utils.formatTime(max_time, max_precision)}</Badge>
            </span>
            {
              (max_precision !== null) ?
                <>
                  <br />
                  <span>
                    <span>{'- Time precision: '}</span>
                    <Badge variant="success">{utils.formatTimePrecision(max_precision)}</Badge>
                  </span>
                </>
                : ''
            }
            <br />
            <span>
              <span>{'- Count: '}</span>
              <Badge variant="success">{count + ' records'}</Badge>
            </span>
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
            <Card.Header className="pl-3 pr-3 pt-2 pb-2" style={{ display: 'flex', fontSize: 'small' }}>

              {/* label */}
              <span className="mr-auto" style={isDebugging ? { width: 'calc(100% - 40px)' } : { width: '100%' }}>
                <span className="card-header-text font-weight-bold" style={{ maxWidth: 'calc(100% - 80px)', color: '#006699' }} title={label}>{label}</span>
                <span className="card-header-text text-muted" style={{ width: '80px' }}>&nbsp;{'(' + name + ')'}</span>
              </span>
              <span style={isDebugging ? {} : { display: 'none' }}>
                <Badge variant="danger">{score.toFixed(3)}</Badge>
              </span>

            </Card.Header>

            {/* body */}
            <Card.Body className="pl-3 pr-3 pt-2 pb-2" style={{ display: 'flex', flexDirection: 'column' }}>

              {/* description */}
              <Card.Text title={description} style={{ fontSize: 'small', flex: '1' }}>
                {utils.truncateStr(description, 280)}
              </Card.Text>

              {/* statistics */}
              <Card.Text className="text-muted" style={{ fontSize: 'small' }}>
                {statisticsHtml}
              </Card.Text>

              {/* qualifiers */}
              {
                isDebugging ?
                  <Card.Text className="text-muted" style={{ fontSize: 'small' }}>
                    {qualifiersHtml}
                  </Card.Text>
                  : ''
              }

            </Card.Body>

          </Card>
        </Col>
      );
    }

    return (
      <Row className="pt-2">
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
            className="responsive-search-bar"
            style={{ minWidth: '50px', width: '20vw', maxWidth: '300px', borderRight: 'none' }}
            ref="inputKeywords"
            placeholder="Enter query..."
            autoFocus
            required
          />
          <div className="responsive-search-bar" style={{ minWidth: '50px', width: '20vw', maxWidth: '300px' }}>
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
  handleSearc(keywords, country ){
    debugger
    let result = queryRequest(keywords, country)
  }

  render() {
    const { isPreviewing, isLoading, loadingValue } = this.state;

    return (
      <div>
      <NavBar onSearch={this.handleSearch}></NavBar>

      </div>
    );
  }
}

export default App;
