import {WikidataTimeSeriesInfo} from './time-series-info';
import config from '../config/config.json';

/*
 * This class contains the application Store, which holds all the TEI data, annotation data, as well as processed data.
 * We are not using a Redux store here to save time. In the future we might turn this into a Redux store.
 * In the mean time, we have a singleton store instance, which is passed to the root component of the application,
 * (although the singleton can just be accessed by any class)
 */

 class UIState {
    public status:status = 'init';
    public isDebugging: boolean = config.isDebugging;
    public isPreviewing: boolean = false;
    public country:string = 'Q30';
    public isLoading:boolean = false;
    public loadingValue: number = 0;
    public keywords:string = '';
 }

 class WikiStore {
    public static instance = new WikiStore();

    public ui = new UIState();
    public iframeSrc:string ='';
    public iframeView:string ='Scatter chart';
    public resultsData:WikidataTimeSeriesInfo [] = [];
    public selectedResult: WikidataTimeSeriesInfo = undefined;

    private constructor() {
        // Can only be created once - as a singleton
    }
}

type status= "init" | "searching" | "error" | "result";
  
const wikiStore = WikiStore.instance;
export default wikiStore;  // Everybody can just access FvStore.property