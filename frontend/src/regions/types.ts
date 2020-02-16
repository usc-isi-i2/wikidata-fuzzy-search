import { observable } from "mobx";
import { getRegions } from "./service";

export interface Region {
    qCode: string,
    name: string,
}

export class RegionNode implements Region {
    public qCode: string;
    public name: string;
    public parent?: RegionNode;
    public displayedChildren: RegionNode[] = [];
    public isChecked: boolean = false;
    public final: boolean;

    public constructor(qCode: string, name: string, final: boolean, parent?: RegionNode) {
        this.qCode = qCode;
        this.name = name;
        this.parent = parent;
        this.final = final;
    }
}
export class CacheEntry {
    public date: string;
    public response: Region[];
}

export class RegionState {
    @observable public path: RegionNode[] = [];
    public nodes: Map<string, RegionNode> = new Map<string, RegionNode>();
    @observable public selectedForest: RegionNode[] = []; // A forest of all selected regions and their parents
    @observable public regionsForSelection: RegionNode[] = []; // All regions displayed in the region-selection pane
    @observable public filterPath: Map<string, string> = new Map<string, string>();
    @observable public filter:string ='';

    public addPathToForest(path: RegionNode[]) {
        if (path.length === 0) {
            console.error("Can't add a zero-length path to the forest");
            return;
        }


        // Make sure all the path is in the list
        let treeLevel: RegionNode[] = this.selectedForest;
        for (const node of path) {
            const idx = treeLevel.findIndex(n => n.qCode === node.qCode);
            let pathNode: RegionNode;
            if (idx === -1) {
                pathNode = node;
                treeLevel.push(node);
            } else {
                pathNode = treeLevel[idx];
            }
            treeLevel = pathNode.displayedChildren;
        }

        this.selectedForest = [...this.selectedForest]; // Make sure tree is refreshed
    }

    public removePathFromForest(path: RegionNode[]) {
        if (path.length === 0) {
            console.error("Can't remove a zero-length path from the forest");
            return;
        }

        // First, find the lowest node of the path in the forest
        let treeLevel: RegionNode[] = this.selectedForest;
        let finalNode: RegionNode;
        for (const node of path) {
            const idx = treeLevel.findIndex(n => n.qCode === node.qCode);
            if (idx === -1) {
                console.error("Can't locate path in tree!");
                return;
            }
            finalNode = treeLevel[idx];
            treeLevel = finalNode.displayedChildren;
        }

        // Now finalNode is the node we need to remove from the tree
        while (finalNode) {
            treeLevel = finalNode.parent?.displayedChildren || this.selectedForest;
            const idx = treeLevel.findIndex(n => n.qCode === finalNode.qCode);
            if (finalNode.displayedChildren.length > 0) { // Node has no children, remove it
                break; // Node has children, do not remove from tree
            } else {
                // Remove finalNode from tree
                treeLevel.splice(idx, 1);
                if (treeLevel.length !== 0) {  // Node had siblings, stop deleting
                    break;
                }
                finalNode = finalNode.parent;
            }
        }

        this.selectedForest = [...this.selectedForest]; // Make sure tree is refreshed
    }

    public getRegionNode(region: Region, regionLevel?:number, parent?: RegionNode) {
        if (!this.nodes.has(region.qCode)) {
            const final = regionLevel==2? true :false; //result of admin3
            const node = new RegionNode(region.qCode, region.name,final,parent); // TODO: Handle parent (last on path?)
            this.nodes.set(region.qCode, node);
            return node;
        }
        return this.nodes.get(region.qCode);
    }

    public setRegions(regions: Region[], regionLevel?: number, parent?: RegionNode) {
        const nodes = regions.map(r => this.getRegionNode(r, regionLevel, parent));
        this.regionsForSelection = nodes;
    }

    public async changePath(newPath: RegionNode[]) {
        const regions = await getRegions(newPath);
        const parent = newPath.length ? newPath[newPath.length - 1] : undefined;

        this.path = [...newPath];
        this.setRegions(regions, newPath.length, parent);
        this.filter = this.getFilter();
    }

    public getRegionsFromForest(): Region[] {
        const regions: Region[] = [];

        function addRegion(nodes: RegionNode[]) {
            for (const node of nodes) {
                if (node.isChecked) {
                    regions.push(node);
                }
                addRegion(node.displayedChildren);
            }
        }

        addRegion(this.selectedForest);

        return regions;
    }

    addToFilterMap(filterValue:string){
        if(this.path.length)
            this.filterPath.set(this.path[this.path.length-1].qCode,filterValue);
        
    }

    public getFilter() {
        const value = this.path.length ?
            this.filterPath.get(this.path[this.path.length-1].qCode)? 
            this.filterPath.get(this.path[this.path.length-1].qCode) : '' : ''
        return value;
    }

}