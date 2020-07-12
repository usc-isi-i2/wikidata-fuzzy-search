import React from 'react';
import * as utils from '../../utils';
import wikiStore from "../../data/store";

// Bootstrap
import Badge from 'react-bootstrap/Badge'
import Card from 'react-bootstrap/Card'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import { WikidataTimeSeriesInfo } from '../../data/types';
import { observer } from 'mobx-react';

interface TimeSeriesInfoProps {
    onSelectResult(result: WikidataTimeSeriesInfo): void;
}

@observer
export default class TimeSeriesInfo extends React.Component<TimeSeriesInfoProps>{
    handleClickResult = (result: WikidataTimeSeriesInfo) => {
        this.props.onSelectResult(result);
        // update state
    }


    render() {
        const { isDebugging, isPreviewing} = wikiStore.ui;
        const { queriedSeries, selectedSeries } = wikiStore.timeSeries;
        let resultsHtml = [];
        for (let i = 0; i < queriedSeries.length; i++) {
            const { name, label, description, statistics, score } = queriedSeries[i];

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
                        border={(selectedSeries && name === selectedSeries.name) ? "primary" : "info"}
                        style={(selectedSeries && name === selectedSeries.name) ? { cursor: 'pointer', background: 'aliceblue' } : { cursor: 'pointer', background: '#f8f9fa' }}
                        onClick={() => this.handleClickResult(queriedSeries[i])}
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
}