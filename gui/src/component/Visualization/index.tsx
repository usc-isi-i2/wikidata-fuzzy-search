import React from 'react';
import wikiStore from "../../data/store";
import ScatterPlot from '../ScatterPlot';
import Table from '../Table';

// FontAwesome
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChartBar, faTable, faTimesCircle, faChartLine, faFileDownload, faAlignJustify, faCog } from '@fortawesome/free-solid-svg-icons'

import { observer } from 'mobx-react';
import LineChart from '../LineChart';
import { CSV } from '../../services/csv';

//Css
import "./visualization.css"
import CustomizationModal from './customization-modal';

interface VisualizationState {
    showModal: boolean;
}

@observer
export default class Visualization extends React.Component<{}, VisualizationState>{
    constructor(props: {}) {
        super(props);
        this.state = { showModal: false };
    }

    componentDidMount = () => {
        this.setState({ showModal: false });
    }

    handleClosePreview = () => {
        // update state
        wikiStore.iframeSrc = '';
        wikiStore.timeSeries.selectedSeries = null;
        wikiStore.ui.previewOpen = false;
        wikiStore.timeSeries.timeSeries = [];
        wikiStore.ui.previewFullScreen = false;

    }

    handleSwitchView = async (view: any) => {
        //const selectedResult = wikiStore.timeSeries.selectedSeries;
        wikiStore.ui.sparqlStatus = "searching";
        console.log(`country code ${wikiStore.ui.region.countryCode} country name is: ${wikiStore.ui.region.countryName}`);
        //wikiStore.timeSeries.timeSeries = await wikiQuery.buildQuery(wikiStore.ui.region.countryCode, selectedResult);
        wikiStore.ui.sparqlStatus = "result";
        switch (view) {
            case 'Table':
                wikiStore.ui.previewType = "table";
                break;
            case 'Scatter chart':
                wikiStore.ui.previewType = 'scatter-plot';
                break;
            case 'Line':
                wikiStore.ui.previewType = 'line-chart';
                break;
            default:
                break;
        }
    }

    handleDownloadCsv() {
        const csv = new CSV(wikiStore.ui.timeSeriesResult.time_points);
        const csvText = csv.generateFile();

        // Download file, taken from here: https://code-maven.com/create-and-download-csv-with-javascript
        const hiddenElement = document.createElement('a');
        hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csvText);
        hiddenElement.target = '_blank';
        hiddenElement.download = wikiStore.timeSeries.selectedSeries.name + ".csv";
        hiddenElement.click();
    }

    handlePreviewFullScreen = () => {
        wikiStore.ui.previewFullScreen = !wikiStore.ui.previewFullScreen;
    }

    handleCustomizations = () => {
        console.debug('Setting showModal to true');
        this.setState( { showModal: true });
    }

    handleCloseModal= () => {
        console.debug('Setting showModal to false in handleCloseModal');
        this.setState( { showModal: false });
    }

    render() {
        let previewWidget: JSX.Element;
        if (wikiStore.ui.previewType === 'scatter-plot') {
            previewWidget = <ScatterPlot></ScatterPlot>;
        } else if (wikiStore.ui.previewType === 'table') {
            previewWidget = <Table></Table>;
        } else if (wikiStore.ui.previewType === "line-chart") {
            previewWidget = <LineChart></LineChart>
        }

        return (
            <div className="h-100">
                {/* buttons */}

                <div className="buttons-div-style">

                    <span onClick={this.handlePreviewFullScreen} id="preview-close" className='Buttons-display' >
                        <FontAwesomeIcon className={"float-btn faTimesCircle" + (wikiStore.ui.previewFullScreen ? " selected" : "")} icon={faAlignJustify} />
                    </span>

                    { /*https://github.com/FortAwesome/react-fontawesome/issues/196*/}
                    <span onClick={this.handleClosePreview} id="preview-close" className='Buttons-display' >
                        <FontAwesomeIcon className="float-btn faTimesCircle" icon={faTimesCircle} />
                    </span>

                    <span id="preview-scatter" onClick={() => this.handleSwitchView('Scatter chart')} className="Buttons-display">
                        <FontAwesomeIcon className={"float-btn" + (wikiStore.ui.previewType === "scatter-plot" ? " selected" : "")} icon={faChartBar} />
                    </span>
                    <span onClick={() => this.handleSwitchView('Line')} className="Buttons-display">

                        <FontAwesomeIcon className={"float-btn" + (wikiStore.ui.previewType === "line-chart" ? " selected" : "")} icon={faChartLine} />

                    </span>
                    <span onClick={() => this.handleSwitchView('Table')} className="Buttons-display" >

                        <FontAwesomeIcon className={"float-btn" + (wikiStore.ui.previewType === "table" ? " selected" : "")} icon={faTable} />

                    </span>

                    <span onClick={this.handleCustomizations} id="customize" className="Buttons-display">
                        <FontAwesomeIcon className="float-btn" icon={faCog} />
                    </span>

                    { /*https://github.com/FortAwesome/react-fontawesome/issues/196*/}
                    <span onClick={this.handleDownloadCsv} id="preview-download" className="Buttons-display">
                        <FontAwesomeIcon className="float-btn" icon={faFileDownload} />
                    </span>
                </div>


                {/* iframe */}
                {previewWidget}

                <CustomizationModal show={this.state.showModal} onHide={this.handleCloseModal} />
            </div>
        );
    }
}