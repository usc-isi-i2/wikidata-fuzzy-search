import { TimePoint } from "../data/types";

// Creates a CSV representation of a timeseries

export class CSV {
    private series: TimePoint[];
    public readonly headers: string[];
    public readonly rows: any[][];

    constructor(series: TimePoint[]) {
        this.series = series;
        this.headers = this.gatherHeaders();
        this.rows = this.generateRows();
    }

    private gatherHeaders(): string[] {
        const headerSet = new Set();
        const headers = [] as string[];

        function addHeader(header) {
            if (!headerSet.has(header)) {
                headerSet.add(header);
                headers.push(header);
            }
        }

        // First two mandatory headers
        addHeader('point_in_time');
        addHeader('value');

        for(const point of this.series) {
            for(const key in point) {
                addHeader(key);
            }
        }

        return headers;
    }
    
    private generateRows(): any[][] {
        const rows = [] as any[][];

        for(const pt of this.series) {
            const row = this.headers.map(header => pt[header]);
            rows.push(row);
        }

        return rows;
    }
}
