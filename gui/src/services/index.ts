import config from '../config/config.json';
import * as utils from '../utils';

export const queryRequest = (keywords:string, country:string) => {
    fetch(config.backendServer + '/linking/wikidata?keywords=' + keywords + '&country=' + country, {
        method: 'get',
        mode: 'cors',
      }).then(response => {
        if (!response.ok) throw Error(response.statusText);
        return response;
      }).then(response => {
        return response.json();
      }).then(json => {
        console.log('<App> <- %c/linking/wikidata%c with search result:', utils.log.link, utils.log.default);
        console.log(json);
        return json;
  }).catch((error)=>{
    console.log(error);
    return error;
  })
}