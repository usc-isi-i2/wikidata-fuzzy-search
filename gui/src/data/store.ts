import { WikidataTimeSeriesInfo, TimePoint, Region } from './types';
import config from '../config/config.json';
import { observable, computed, action } from 'mobx';

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
    @observable public region: Region;
    @observable public keywords = '';
    @observable public previewType: PreviewType = 'scatter-plot';
    @observable public previewOpen: boolean = false;
    @observable public sparqlStatus: AppStatus = 'init';
    @observable public previewFullScreen: boolean = false;
    @observable public visualizationManager = new VisualizationManager();
    @observable public loadingValue = 0;

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
    @observable public timeSeries: TimePoint[] = [];
}

class WikiStore {
    @observable public ui = new UIState();
    @observable public timeSeries = new TimeSeriesState();
    @observable public iframeSrc: string = '';
    @observable public iframeView: string = 'Scatter chart';
}

class VisualizationParamsScatter {
    @observable public color: string = 'purple';
    @observable public mode: string = 'markers';
    @observable public type: string = 'scatter';
}
// class VisualizationParamsLineChart {
//     @observable public color: string = 'pink';
//     @observable public mode: string = 'lines';
//     @observable public type: string = 'Lines';
// }
class VisualizationManager {
    @observable public visualiztionData: VisualizationParamsScatter[] = [];
    constructor() {
        this.loadFromLocalStorage();
    }

    private loadFromLocalStorage() {
        let localStorgateData = JSON.parse(localStorage.getItem('visualiztionData'));
        if (localStorgateData) {
            for (const item of localStorgateData) {
                let tmpVisualizationParams= new VisualizationParamsScatter();
                tmpVisualizationParams.color = item['color']
                tmpVisualizationParams.mode = item['mode']
                this.visualiztionData.push(tmpVisualizationParams);
            }
        } else {
            for (let i = 0; i < 10; i++) {
                let tmpVisualizationParams = new VisualizationParamsScatter();
                this.visualiztionData.push(tmpVisualizationParams);
            }
        }
    }

    setLocalStorage() {
        localStorage.setItem('visualiztionData', JSON.stringify(this.visualiztionData));
    }
}
const wikiStore = new WikiStore();
export default wikiStore;  // Everybody can just access wikiStore.property