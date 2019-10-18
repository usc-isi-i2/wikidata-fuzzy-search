import React from 'react';
import './App.css';

// Local
import countriesData from './data/countriesData'
// import sampleResponse from './data/sampleResponse'
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

class App extends React.Component {
  constructor(props) {
    super(props);

    // init state
    this.state = {

      // appearance
      isPreviewing: false,
      isLoading: false,

      // result
      query: { keywords: '', country: 'Q30' }, // { keywords: 'homicide', country: 'Q30' }
      // keywordData: {}, // { 'homicide': true, 'mismatched1': false, 'mismatched2': false, 'homicides': true, 'murder': true, 'homocide': true, 'murders': true, 'slaying': true, 'fatality': true, 'crime': true, 'arson': true, 'killings': true },
      resultsData: [],
      // resultsData: sampleResponse[0].alignments,
      selectedDataset: null,
      iframeSrc: '', // 'https://query.wikidata.org/embed.html#%23defaultView%3ALineChart%0ASELECT%20%28STRDT%28CONCAT%28%3Fyear%2C%20%22-01-01T00%3A00%3A00Z%22%29%2C%20xsd%3AdateTime%29%20AS%20%3FYear%29%20%28AVG%28%3Fvalue%29%20AS%20%3FPopulation%29%20WHERE%20%7B%0A%20%20wd%3AQ30%20p%3AP1082%20%3Fo%20.%0A%20%20%3Fo%20ps%3AP1082%20%3Fvalue%20.%0A%20%20FILTER%20%28STRSTARTS%28STR%28%3Fqualifier%29%2C%20STR%28pq%3A%29%29%29%20.%0A%20%20FILTER%20%28%21STRSTARTS%28STR%28%3Fqualifier%29%2C%20STR%28pqv%3A%29%29%29%20.%0A%20%20BIND%20%28IRI%28REPLACE%28STR%28%3Fqualifier%29%2C%20STR%28pq%3A%29%2C%20STR%28wd%3A%29%29%29%20AS%20%3Fqualifier_entity%29%20.%0A%20%20%3Fqualifier_entity%20wikibase%3ApropertyType%20wikibase%3ATime%20.%0A%20%20%3Fo%20%3Fqualifier%20%3Fqualifier_value%20.%0A%20%20BIND%28STR%28YEAR%28%3Fqualifier_value%29%29%20AS%20%3Fyear%29%20.%0A%7D%0AGROUP%20BY%20%3Fyear',
      iframeView: 'Table',

    }
  }

  handleClickDataset(dataset) {
    const { query } = this.state;

    // update state
    this.setState({
      isPreviewing: true,
      selectedDataset: dataset,
      iframeSrc: wikidataQuery.table(query.country, dataset),
      iframeView: 'Table',
    });
  }

  handleClosePreview() {

    // update state
    this.setState({
      isPreviewing: false,
      selectedDataset: null,
      iframeSrc: '',
    });
  }

  handleSearch() {
    const keywords = this.refs.inputKeywords.value.trim();
    const country = this.refs.inputCountry.value;

    // before rendering search result
    document.title = keywords + ' - Fuzzy Search'; // update page title
    this.setState({
      isPreviewing: false,
      isLoading: true,
      query: { keywords: '', country: 'Q30' },
      resultsData: [],
      selectedDataset: null,
      iframeSrc: '',
    });

    // send request to get search result
    console.log('<App> -> %c/linking/wikidata%c to search', utils.log.link, utils.log.default);
    fetch('http://kg2018a.isi.edu:14000/linking/wikidata?keywords=' + keywords + '&country=' + country, {
      method: 'get',
      mode: 'cors',
    }).then(response => {
      if (!response.ok) throw Error(response.statusText);
      return response;
    }).then(response => {
      return response.json();
    }).then(json => {
      console.log('<App> <- %c/linking/wikidata%c with search result', utils.log.link, utils.log.default);
      console.log(json);

      // error handling
      // TODO

      // update state
      let resultsData = [];
      for (let i = 0; i < json.length; i++) {
        resultsData = resultsData.concat(json[i].alignments);
      }
      this.setState({
        isLoading: false,
        query: { keywords: keywords, country: country },
        resultsData: resultsData,
      });

    }).catch((error) => {
      console.log(error);

      // error handling
      alert(error);
      this.setState({ isLoading: false });
    });
  }

  handleSwitchView(view) {
    const { query, selectedDataset } = this.state;
    switch (view) {
      case 'Table':
        this.setState({
          iframeSrc: wikidataQuery.table(query.country, selectedDataset),
          iframeView: 'Table',
        });
        break;
      case 'Scatter chart':
        this.setState({
          iframeSrc: wikidataQuery.scatterChart(query.country, selectedDataset),
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
    const { isPreviewing, resultsData, selectedDataset } = this.state;

    let resultsHtml = [];
    for (let i = 0; i < resultsData.length; i++) {
      const { name, label, description, qualifiers } = resultsData[i];

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
            border={(selectedDataset !== null && name === selectedDataset.name) ? 'primary' : ''}
            style={(selectedDataset !== null && name === selectedDataset.name) ? { cursor: 'pointer', background: 'aliceblue' } : { cursor: 'pointer', background: '#f8f9fa' }}
            onClick={() => this.handleClickDataset(resultsData[i])}
          >

            {/* header */}
            <Card.Header className="pl-3 pr-3 pt-2 pb-2" style={{ fontSize: 'small' }}>

              {/* label */}
              <span className="font-weight-bold text-mint-blue" title={label}>{utils.truncateStr(label, 30)}</span>
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
    let countriesHtml = [];
    const qnodes = Object.keys(countriesData); // qnodes for countries
    for (let i = 0; i < qnodes.length; i++) {
      countriesHtml.push(
        <option key={i} value={qnodes[i]}>
          {countriesData[qnodes[i]]}
        </option>
      );
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
            style={{ minWidth: '60px', width: '24vw', maxWidth: '360px' }}
            ref="inputKeywords"
            placeholder="Enter query..."
            autoFocus
            required
          />
          <Form.Control
            as="select"
            style={{ minWidth: '40px', width: '16vw', maxWidth: '240px' }}
            ref="inputCountry"
            defaultValue="Q30"
          >
            {countriesHtml}
          </Form.Control>
          <InputGroup.Append>
            <Button type="submit" variant="outline-success" title="Search">
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
  //       style={{ position: 'absolute', height: '28px', zIndex: '200', background: 'white', borderBottom: '1px solid #76a746' }}
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
    const { isPreviewing, isLoading } = this.state;

    return (
      <div style={{ width: '100vw', height: '100vh' }}>

        {/* navbar */}
        <Navbar bg="light" style={{ height: '70px', borderBottom: '1px solid #1990d5', zIndex: '400' }} className="shadow">

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
          {isLoading ? <div className="loading" style={{ zIndex: '250' }}><ProgressBar animated variant="success" now={50} /></div> : ''}

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
              style={{ height: '100%', overflow: 'auto', borderLeft: '1px solid #1990d5', zIndex: '300' }}
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
