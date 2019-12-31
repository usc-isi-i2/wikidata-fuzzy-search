import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Dataset from '../TimeSeriesInfo/index';
import ProgressBar from '../ProgressBar/index';
import React from 'react';
import Row from 'react-bootstrap/Row';
import wikiStore from '../../data/store';
import { WikidataTimeSeriesInfo } from '../../data/types';
import Visualization from '../Visualization/index';
import { observer } from 'mobx-react';

interface MainProps {
    onSelectedResult(result: WikidataTimeSeriesInfo): void;
}
@observer
export default class Main extends React.Component<MainProps>{
    handleSelectedResult = (result: WikidataTimeSeriesInfo) => {
        this.props.onSelectedResult(result);
    }

    render() {
        const { isPreviewing } = wikiStore.ui;
        return (
            <Container fluid className="p-0" style={{ overflow: 'hidden', height: 'calc(100vh - 70px)' }}>
                <ProgressBar></ProgressBar>

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
                        <Dataset onSelectResult={this.handleSelectedResult}></Dataset>
                    </Col>

                    {/* preview */}
                    <Col
                        xs={isPreviewing ? 6 : 0}
                        md={isPreviewing ? 6 : 0}
                        xl={isPreviewing ? 6 : 0}
                        className="shadow p-0"
                        style={{ height: '100%', overflow: 'auto', borderLeft: '1px solid #006699', zIndex: 500 }}
                    >
                        <Visualization></Visualization>
                    </Col>

                </Row>
            </Container>
        );
    }
}