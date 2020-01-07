import Container from 'react-bootstrap/Container';
//import Col from 'react-bootstrap/Col';
import Dataset from '../TimeSeriesInfo';
import ProgressBar from '../ProgressBar';
import React from 'react';
import Row from 'react-bootstrap/Row';
import wikiStore from '../../data/store';
import { WikidataTimeSeriesInfo } from '../../data/types';
import Visualization from '../Visualization/index';
import { observer } from 'mobx-react';
import './main.css';

interface MainProps {
    onSelectedResult(result: WikidataTimeSeriesInfo): void;
}
@observer
export default class Main extends React.Component<MainProps>{
    handleSelectedResult = (result: WikidataTimeSeriesInfo) => {
        this.props.onSelectedResult(result);
    }

    render() {
        //const { isPreviewing } = wikiStore.ui;
        return (
            <Container fluid className="p-0" style={{ overflow: 'hidden', height: 'calc(100vh - 70px)' }}>
                <ProgressBar></ProgressBar>

                {/* filters */}
                {/* {this.renderFilters()} */}

                <Row className="h-100 m-0">

                    {/* resultsData */}
                    <div
                        style={{ height: '100%', overflow: 'auto' }}
                        className = {"resultData"+ (wikiStore.ui.previewFullScreen? " previewFullScreen": (wikiStore.ui.isPreviewing? " col-xl-6 col-md-6 col-6" : " col-xl-12 col-md-12 col-12"))}
                    >
                        <Dataset onSelectResult={this.handleSelectedResult}></Dataset>
                    </div>

                    {/* preview */}
                    <div
                        className={"shadow" + (wikiStore.ui.previewFullScreen? " previewFullScreen": (wikiStore.ui.isPreviewing? " col-xl-6 col-md-6 col-6" : " col-xl-0 col-md-0 col-0"))}
                        style={{ height: '100%', borderLeft: '1px solid #006699', zIndex: 500}}
                    >
                        {wikiStore.ui.previewOpen && wikiStore.timeSeries.results? <Visualization></Visualization> : <br></br>}
                        
                    </div>

                </Row>
            </Container>
        );
    }
}