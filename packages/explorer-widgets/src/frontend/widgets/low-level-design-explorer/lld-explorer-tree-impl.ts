import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager';
import { LowLevelDesign } from "@gestola/project-manager";

@injectable()
export class LLDExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> { 
    let proj = this.projManager.getCurrProject();
    if(proj){
    
      return Promise.resolve(proj.lowLevelDesignes.sort((a, b) => {
        return a.name.localeCompare(b.name);
      }).map(i => this.makeTreeNode(i)));

    } else {
      return Promise.resolve([]);
    }

  }

    makeTreeNode(mdl: LowLevelDesign) {
      const node: LLDTreeNode = {
        id: mdl.name,
        name: mdl.name,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        model: mdl
      };
      return node;
    }


 }

export interface LLDTreeNode extends CompositeTreeNode, SelectableTreeNode {
  model: LowLevelDesign
}