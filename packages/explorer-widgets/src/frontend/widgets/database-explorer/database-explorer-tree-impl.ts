import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode, ExpandableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { Column, Table } from "@gestola/project-manager/lib/common/database";
import { v4 } from 'uuid';

@injectable()
export class DatabaseExplorerTreeImpl extends TreeImpl {

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;

    protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {

        let proj =  this.projManager.getCurrProject();
        if(proj){
            return Promise.resolve(
                this.projManager.getCurrProject()!.reportDatabaseDescription.tables.map(e => this.makeTableTreeNode(e))
            );
        } else {
            return Promise.resolve([]);
        }

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