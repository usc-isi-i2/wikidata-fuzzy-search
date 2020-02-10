import { TimePoint, WikidataTimeSeriesInfo } from "../data/types";
import { TimeSeriesResultDTO, ColumnInfoDTO } from "../dtos";
import { Region } from "../regions/types";

export class ColumnInfo {
    public readonly name: string;
    public readonly numeric: boolean;
    public readonly values: string[];
    public readonly min?: number;
    public readonly max?: number;

    constructor(fieldName: string, numeric: boolean, rows: any[]) {
        this.name = fieldName;
        this.values = this.getValues(rows);
        this.numeric = numeric;

        if (this.numeric) {
            [this.min, this.max] = this.getRange();
        }
    }

    private getValues(rows: any[]) {
        const values = rows.map(row => row[this.name] !== undefined ? String(row[this.name]) : undefined);
        const set = new Set(values);
        const unique = Array.from(set);

        return unique;
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


    constructor(timeSeriesInfo: WikidataTimeSeriesInfo, regions: Region[], dto: TimeSeriesResultDTO) {
        this.timeSeriesInfo = timeSeriesInfo;
        this.regions = regions;
        this.points = dto.points;
        this.columns = this.fillColumnInfo(dto.columns);
        this.headers = this.columns.map(col => col.name);
    }

   
    private fillColumnInfo(columnDTOs: ColumnInfoDTO[]) {
        const columns = columnDTOs.map(dto => new ColumnInfo(dto.name, dto.numeric, this.points))
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