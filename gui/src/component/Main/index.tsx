import React from 'react';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import ProgressBar from 'react-bootstrap/ProgressBar';
import Row from 'react-bootstrap/Row';



export default class NavBar extends React.Component<any, any>{
  constructor(props:any){
    super(props);
  }

  handleSearchSubmit(keywords:string, country:string){
    this.props.onSearch(keywords, country);
  }
  renderPreview(){
      return '';
  }
  renderDatasets(){
      return '';
  }

  render () {
    return (
        <Container fluid className="p-0" style={{ overflow: 'hidden', height: 'calc(100vh - 70px)' }}>

        {/* loading */}
        {this.props.isLoading ? <div className="loading" style={{ zIndex: 750, background: 'rgba(0, 0, 0, 0.1)' }}><ProgressBar animated variant="success" now={this.props.loadingValue} /></div> : ''}

        {/* filters */}
        {/* {this.renderFilters()} */}

        <Row className="h-100 m-0">

          {/* resultsData */}
          <Col
            xs={this.props.isPreviewing ? 6 : 12}
            md={this.props.isPreviewing ? 6 : 12}
            xl={this.props.isPreviewing ? 6 : 12}
            style={{ height: '100%', overflow: 'auto' }}
          >
            {this.renderDatasets()}
          </Col>

          {/* preview */}
          <Col
            xs={this.props.isPreviewing ? 6 : 0}
            md={this.props.isPreviewing ? 6 : 0}
            xl={this.props.isPreviewing ? 6 : 0}
            className="shadow p-0"
            style={{ height: '100%', overflow: 'auto', borderLeft: '1px solid #006699', zIndex: 500 }}
          >
            {this.props.isPreviewing ? this.renderPreview() : ''}
          </Col>

        </Row>
      </Container>
    );
  }
}