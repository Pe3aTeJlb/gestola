import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode, ExpandableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager';
import { Column, Table } from "@gestola/project-manager";
import { v4 } from 'uuid';

@injectable()
export class DatasetSelectorTreeImpl extends TreeImpl {

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;

    protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
        
        let proj =  this.projManager.getCurrProject();

        if(parent.id == "dummy-root"){
            if(proj){
                return Promise.resolve(
                    proj.reportDatabaseDescription.tables.map(e => this.makeTableTreeNode(e))
                );
            }
        }

        if('columns' in parent){
            return Promise.resolve(
                (parent as TableTreeNode).columns.map(e => this.makeColumnTreeNode(e))
            );
        }

        return Promise.resolve([]);

    }

    makeTableTreeNode(table: Table) {
        const node: TableTreeNode = {
            id: v4(),
            name: table.name,
            parent: undefined,
            selected: false,
            visible: true,
            children: table.columns.map(e => this.makeColumnTreeNode(e)),
            columns: table.columns,
            expanded: false
        };
        return node;
    }

    makeColumnTreeNode(column: Column) {
        const node: CompositeTreeNode = {
            id: v4(),
            name: `${column.name}: ${column.type}`,
            parent: undefined,
            visible: true,
            children: [],
        };
        return node;
    }


 }

export interface TableTreeNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
    columns: Column[];
}