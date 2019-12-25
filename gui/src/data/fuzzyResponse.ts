
interface Statistics {
    min_time:string;
    max_time:string;
    count:number; 
    max_precision:number;
}
export class fuzzyResponse {
    public name:string = '';
    public label: string = '';
    public description: string = '';
    public aliases: string [] = [];
    public time: string = '';
    public qualifiers: Map<string, string>;
    public statistics: Statistics;
    public score:number=0;

    public constructor(){
        this.qualifiers = new Map <string, string>();
    }
 

}