import config from "../config";
import { WikidataTimeSeriesInfo } from "../data/types";
import { FuzzySearchResponseDTO } from "../dtos";

export async function queryKeywords(
    keywords: string,
    //country: string    `/linking?keywords=${keywords}&country=${country}`;
): Promise<Array<WikidataTimeSeriesInfo>> {
    const url =
        config.backendServer + `/metadata/variables?keyword=${keywords}`
     
    const response = await fetch(url, {
        method: "get",
        mode: "cors"
    });
    if (!response.ok) {
        throw Error(response.statusText);
    }

    const json = (await response.json()) as FuzzySearchResponseDTO[];//WikidataTimeSeriesInfo[];
    const results = json.map(r => { //getResultsData(json);
        return {name: r.name, label: r.dataset_id, description: r.variable_id, score: r.rank, 
            datasetId: r.dataset_id, variableId: r.variable_id} as WikidataTimeSeriesInfo
    });

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
