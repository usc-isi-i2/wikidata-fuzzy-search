

export class BasicResponse {
    public time:string = '';
    public value: number = 0;
    protected constructor() {

} 
}
//maybe we will need more fields for 3d
export class ScatterChart extends BasicResponse {
    private constructor() {
        super()    
}
}

export class Table extends BasicResponse{
    public qualifiers_list: string [] = [];
    private constructor() {
        super()
}
}

