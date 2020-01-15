import { WikidataTimeSeriesInfo, TimePoint, Region } from './types';
import config from '../config/config';
import { observable, computed } from 'mobx';
import { VisualizationManager } from './visualizations-params';
import { TimeSeriesResult } from '../queries/time-series-result';

/*
 * This class contains the application Store, which holds all the TEI data, annotation data, as well as processed data.
 * We are not using a Redux store here to save time. In the future we might turn this into a Redux store.
 * In the mean time, we have a singleton store instance, which is passed to the root component of the application,
 * (although the singleton can just be accessed by any class)
 */

type PreviewType = 'scatter-plot' | 'line-chart' | 'table';
type AppStatus = "init" | "searching" | "error" | "result";

class UIState {
    @observable public status: AppStatus = 'init';
    @observable public isDebugging: boolean = config.isDebugging;
    //@observable public country = 'Q30';
    @observable public region: Region[];
    @observable public keywords = '';
    @observable public previewType: PreviewType = 'scatter-plot';
    @observable public previewOpen: boolean = false;
    @observable public sparqlStatus: AppStatus = 'init';
    @observable public previewFullScreen: boolean = false;
    @observable public loadingValue = 0;
    @observable public visualizationParams = new VisualizationManager();

    @computed get isLoading() {
        return this.status === 'searching';
    }
    @computed get isSparslLoading() {
        return this.sparqlStatus === 'searching';
    }

    @computed get isPreviewing() {
        return this.previewOpen && this.status === 'result';
    }
}

class TimeSeriesState {
    @observable public queriedSeries: WikidataTimeSeriesInfo[] = [];
    @observable public selectedSeries: WikidataTimeSeriesInfo | undefined;
    @observable public result: TimeSeriesResult | undefined;

    @computed get name() {
        return this.selectedSeries.name + " " + this.selectedSeries.label;
    }
}

class WikiStore {
    @observable public ui = new UIState();
    @observable public timeSeries = new TimeSeriesState();
    @observable public iframeSrc: string = '';
    @observable public iframeView: string = 'Scatter chart';
}

const wikiStore = new WikiStore();
export default wikiStore;  // Everybody can just access wikiStore.property