import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Dataset from '../Dataset/index';
import Preview from '../Preview/index';
import Progressbar from '../Progressbar/index';
import React from 'react';
import Row from 'react-bootstrap/Row';
import WikiStore from '../../data/store';

export default class NavBar extends React.Component<any, any>{
    handleSearchSubmit(keywords: string, country: string) {
        this.props.onSearch(keywords, country);
    }
    renderPreview() {
        return '';
    }
    renderDatasets() {
        return '';
    }

    handleSelectedResult(dataset) {
        this.props.onSelectedResult(dataset);
    }

    render() {
        const { isPreviewing } = WikiStore;
        return (
            <Container fluid className="p-0" style={{ overflow: 'hidden', height: 'calc(100vh - 70px)' }}>
                <Progressbar></Progressbar>

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
                        <Dataset onSelectResult={(dataset) => this.handleSelectedResult(dataset)}></Dataset>
                    </Col>

                    {/* preview */}
                    <Col
                        xs={isPreviewing ? 6 : 0}
                        md={isPreviewing ? 6 : 0}
                        xl={isPreviewing ? 6 : 0}
                        className="shadow p-0"
                        style={{ height: '100%', overflow: 'auto', borderLeft: '1px solid #006699', zIndex: 500 }}
                    >
                        <Preview></Preview>
                    </Col>

                </Row>
            </Container>
        );
    }
}