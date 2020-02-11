import { observable, computed } from "mobx";

export interface Region {
    qCode: string,
    name: string,
}

export class RegionNode implements Region {
    public qCode: string;
    public name:string;
    public parent?:RegionNode;
    public displayedChildren: RegionNode[] = [];
    public isChecked: boolean = false;

    public constructor(qCode: string, name: string, parent?: RegionNode) {
        this.qCode = qCode;
        this.name = name;
        this.parent = parent;
    }
} 

export class RegionState {
    @observable public path: RegionNode[] = [];
    @observable public nodes: Map<string, RegionNode> = new Map<string, RegionNode>();
    @observable public displayedRegions: RegionNode[] = []; // Regions displayed with checkboxes on the left pane
    @observable public selectedForest: RegionNode[] = []; // A forest of all selected regions and their parents

    public addPathToForest(path: RegionNode[]) {
        // Make sure the path appears in the forest - add all the necessary nodes
    }

    public removePathFromForest(path: RegionNode[]) {
        // Remove the path from the forest - remove non-leaf nodes only if they become leaves.
        // Remove last part of path, then check node before that - if it has no more children, remove it
        // and so on
    }
}