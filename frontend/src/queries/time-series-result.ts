import { TimePoint, WikidataTimeSeriesInfo, Region } from "../data/types";

export class ColumnInfo {
    public readonly name: string;
    public readonly numeric: boolean;
    public readonly values: string[];
    public readonly min?: number;
    public readonly max?: number;

    constructor(fieldName: string, rows: any[]) {
        this.name = fieldName;
        this.values = this.getValues(rows);
        this.numeric = this.checkNumeric();

        if (this.numeric) {
            [this.min, this.max] = this.getRange();
        }
    }

    private getValues(rows: any[]) {
        const values = rows.map(row => String(row[this.name]));
        const set = new Set(values);
        const unique = Array.from(set);

        return unique;
    }

    private checkNumeric() {
        return this.values.filter(v => Number.isNaN(Number(v))).length === 0;
    }

    private getRange(): [number, number] {
        const numbers = this.values.map(v => Number(v));
        return [Math.min(...numbers), Math.max(...numbers)];
    }
}

export class TimeSeriesResult {
    public readonly timeSeriesInfo: WikidataTimeSeriesInfo;
    public readonly regions: Region[];
    public readonly points: TimePoint[];
    public readonly columns: ColumnInfo[];
    public readonly headers: string[];


    constructor(timeSeriesInfo: WikidataTimeSeriesInfo, regions: Region[], points: TimePoint[]) {
        this.timeSeriesInfo = timeSeriesInfo;
        this.regions = regions;
        this.points = points;
        this.columns = this.fillColumnInfo();
        this.headers = this.columns.map(col => col.name);
    }

    private gatherHeaders(): string[] {
        const headerSet = new Set<string>();
        const headers = [] as string[];
    
        function addHeader(header: string) {
            if (!headerSet.has(header)) {
                headerSet.add(header);
                headers.push(header);
            }
        }
    
        // First two mandatory headers
        addHeader('point_in_time');
        addHeader('value');
    
        for(const point of this.points) {
            for(const key in point) {
                addHeader(key);
            }
        }
    
        return headers;
    }
    
    private fillColumnInfo() {
        const headers = this.gatherHeaders();
        const columns = headers.map(header => new ColumnInfo(header, this.points));

        return columns;
    }

    public generateCSV() {
        let generateRows = (): any[][] => {
            const rows = [] as any[][];
    
            for(const pt of this.points) {
                const row = this.columns.map(column => pt[column.name]);
                rows.push(row);
            }
    
            return rows;
        }
    
        let convertCol = (value: any) => {
            if (value === undefined) {
                return '';
            }
            return '"' + String(value).replace('"', '""') + '"';
        }
    
        let convertLine = (line: any[]) => {
            return line.map(col => convertCol(col)).join(',');
        }
    
        const rows = generateRows();

        const lines = [convertLine(this.headers), ...rows.map(row => convertLine(row))];
        return lines.join('\r\n');
    }
}