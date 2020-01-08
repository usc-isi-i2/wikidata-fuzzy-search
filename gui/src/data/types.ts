
export interface Statistics {
    min_time: string;
    max_time: string;
    count: number;
    max_precision: number;
}

export interface WikidataTimeSeriesInfo {
    name: string;
    label: string;
    description: string;
    aliases: string[];
    time: string | null;
    qualifiers: { [key: string]: string };
    statistics: Statistics | undefined;
    score: number;
}

export interface TimePoint {
    point_in_time: string;
    value: number;
}

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
export class Region {
    constructor(public countryCode: string, public countryName: string) { }

    public get name(): string {
        return this.countryName;
    }
}

//need to add visualiztion params
export interface TimeSeriesResult {
    index: number;
    region: Region | undefined;
    time_points: TimePoint[];
    info: WikidataTimeSeriesInfo | undefined;
    columns: ColumnInfo[];
}
