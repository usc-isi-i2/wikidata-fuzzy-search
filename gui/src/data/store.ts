import {WikidataTimeSeriesInfo} from './time-series-info';
import config from '../config/config.json';
import { observable, computed } from 'mobx';

/*
 * This class contains the application Store, which holds all the TEI data, annotation data, as well as processed data.
 * We are not using a Redux store here to save time. In the future we might turn this into a Redux store.
 * In the mean time, we have a singleton store instance, which is passed to the root component of the application,
 * (although the singleton can just be accessed by any class)
 */

 class UIState {
    @observable public status:status = 'init';
    @observable public isDebugging: boolean = config.isDebugging;
    @observable public isPreviewing = false;
    @observable public country = 'Q30';
    @observable public keywords = '';
    
    @observable public loadingValue = 0;
    @computed get isLoading() {
        return this.status === 'searching';
    }
 }

 class TimeSeriesState {
     public queriedSeries: WikidataTimeSeriesInfo[] = [];
     public selectedSeries: WikidataTimeSeriesInfo | undefined;
 }

 class WikiStore {
    @observable public ui = new UIState();
    @observable public timeSeries = new TimeSeriesState();
    @observable public iframeSrc:string ='';
    @observable public iframeView:string ='Scatter chart';
}

type status= "init" | "searching" | "error" | "result";
  
const wikiStore = new WikiStore();
export default wikiStore;  // Everybody can just access FvStore.property