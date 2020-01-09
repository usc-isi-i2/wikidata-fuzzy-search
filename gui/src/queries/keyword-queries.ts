import config from "../config/config.json";
import { WikidataTimeSeriesInfo } from "../data/types";

export async function queryKeywords(
    keywords: string,
    country: string
): Promise<Array<WikidataTimeSeriesInfo>> {
    const url =
        config.backendServer +
        `/linking/wikidata?keywords=${keywords}&country=${country}`;
    const response = await fetch(url, {
        method: "get",
        mode: "cors"
    });
    if (!response.ok) {
        throw Error(response.statusText);
    }

    const json = (await response.json()) as WikidataTimeSeriesInfo[];
    const results = getResultsData(json);

    return results;
}

function getResultsData(response: any[]): WikidataTimeSeriesInfo[] {
    /**
     * Extract resultsData from response.
     *
     * @param {array}   response
     *
     * @return {array}  resultsData.
     */

    let resultsData: any[] = [];

    let temp: any = {};
    for (let i = 0; i < response.length; i++) {
        const alignments = response[i].alignments;
        for (let j = 0; j < alignments.length; j++) {
            const result = alignments[j];
            if (temp[result.name] === undefined) {
                // first time of this result
                temp[result.name] = result;
            } else {
                // if there is already a result with the same name, update score
                const prevScore = temp[result.name].score;
                if (result.score > prevScore) {
                    temp[result.name] = result;
                }
            }
        }
    }

    resultsData = Object.values(temp);
    resultsData.sort((r1, r2) => r2.score - r1.score);

    return resultsData as WikidataTimeSeriesInfo[];
}
