import config from '../config/config.json';

async function fuzzyRequest(keywords:string, country:string): Promise<any> {
    console.log(`inside query request ${config.backendServer}`);
    const url = config.backendServer + `/linking/wikidata?keywords=${keywords}&country=${country}`;  
    console.log(`inside query request ${url}`);
    const response = await fetch(url, {
        method: 'get',
        mode: 'cors',
    });
    console.log('Got a response');
    if (!response.ok) throw Error(response.statusText);
    return response.json();
}

export { fuzzyRequest };