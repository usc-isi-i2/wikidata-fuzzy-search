import config from '../config/config.json';
import {fuzzyResponse} from '../data/fuzzyResponse';
import * as utils from '../utils';

async function fuzzyRequest(keywords:string, country:string): Promise<Array<fuzzyResponse>> {
    console.log(`inside query request ${config.backendServer}`);
    const url = config.backendServer + `/linking/wikidata?keywords=${keywords}&country=${country}`;  
    console.log(`inside query request ${url}`);
    const response = await fetch(url, {
        method: 'get',
        mode: 'cors',
    }).then(response => {
      if (!response.ok) throw Error(response.statusText);
      return response;
    }).then(data => {
      return data.json();
    }).then(json =>
      {
        //let result = utils.getResultsData(json);
        //let formatedResult = formatResult(result);
        return utils.getResultsData(json);
      });
    console.log('Got a response');
    return response;
}
// function formatResult(data:){
//   let fuzzyResultArra: fuzzyResponse [];
//   data.forEach(function (arrayItem) {
//     let obj = new fuzzyResponse();
  

//     debugger
// });


export { fuzzyRequest };