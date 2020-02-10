import { WikidataTimeSeriesInfo } from './types';
import config from '../config/config';
import { observable, computed } from 'mobx';
import { ScatterGroupingParams, ScatterGroupingCache } from '../customizations/visualizations-params';
import { TimeSeriesResult } from '../queries/time-series-result';
import { Region } from '../regions/types';
import { getCountries } from '../regions/service';

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
    @observable public scatterGroupingParams = new ScatterGroupingParams();
    @observable public countries: Region[];

    public constructor() {
        this.preloadCountries();
    }

    public customiztionsCache = new ScatterGroupingCache();

    @computed get isLoading() {
        return this.status === 'searching';
    }
    @computed get isSparslLoading() {
        return this.sparqlStatus === 'searching';
    }

    @computed get isPreviewing() {
        return this.previewOpen && this.status === 'result';
    }

    private async preloadCountries() {
        // Fill the top-level country list
        const stored = localStorage.getItem('countries') || "[{ qCode: 'Q30', name: 'United States of America'}]"; // Default
        const parsed = JSON.parse(stored) as Region[];
        this.countries = parsed;
        console.debug('Loading countries from cache: ', parsed);

        // Load from server
        const countries = await getCountries();
        localStorage.setItem('countries', JSON.stringify(countries));
        this.countries = countries;
        console.debug('Loaded countries from server: ', countries);
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