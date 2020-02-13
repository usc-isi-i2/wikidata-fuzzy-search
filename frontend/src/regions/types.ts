import { observable } from "mobx";
import { getRegions } from "./service";

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
export class CacheEntry{
    public date: string;
    public response: Region[];
} 

export class RegionState {
    @observable public path: RegionNode[] = [];
    public nodes: Map<string, RegionNode> = new Map<string, RegionNode>();
    @observable public selectedForest: RegionNode[] = []; // A forest of all selected regions and their parents
    @observable public regionsForSelection: RegionNode[] = []; // All regions displayed in the region-selection pane

    public addPathToForest(path: RegionNode[]) { 
        if (path.length !== 1) {
            throw new Error('Paths longer than 1 are not supported yet');
        }

        if (this.selectedForest.findIndex(n => n.qCode === path[0].qCode) === -1) {
            this.selectedForest.push(path[0]);
        }
    }

    public removePathFromForest(path: RegionNode[]) {
        if (path.length !== 1) {
            throw new Error('Paths longer than 1 are not supported yet');
        }

        const idx = this.selectedForest.findIndex(n => n.qCode === path[0].qCode);
        if (idx !== -1) {
            this.selectedForest.splice(idx, 1);
        }
    }

    public getRegionNode(region: Region, parent?: RegionNode) {
        if (!this.nodes.has(region.qCode)) {
            const node = new RegionNode(region.qCode, region.name, parent); // TODO: Handle parent (last on path?)
            this.nodes.set(region.qCode, node);
            return node;
        }
        return this.nodes.get(region.qCode);
    }

    public setRegions(regions: Region[], parent?: RegionNode) {
        const nodes = regions.map(r => this.getRegionNode(r, parent));
        this.regionsForSelection = nodes;
    }
    
    public async changePath(newPath: RegionNode[]) {
        const regions = await getRegions(newPath);
        const parent = newPath.length ? newPath[newPath.length - 1] : undefined;
        
        this.path = [...newPath];
        this.setRegions(regions);
    }
}