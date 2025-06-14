import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { RTLModel } from "@gestola/project-manager/src/frontend/project-manager/rtl-model";

@injectable()
export class RTLModelExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> { 
    let proj = this.projManager.getCurrProject();
    if(proj){
    
      return Promise.resolve(proj.rtlModels.sort((a, b) => {
        return a.rtlModelName.localeCompare(b.rtlModelName);
      }).map(i => this.makeTreeNode(i)));

    } else {
      return Promise.resolve([]);
    }

  }

    makeTreeNode(mdl: RTLModel) {
      const node: RTLModelTreeNode = {
        id: mdl.rtlModelName,
        name: mdl.rtlModelName,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        model: mdl
      };
      return node;
    }


 }

export interface RTLModelTreeNode extends CompositeTreeNode, SelectableTreeNode {
  model: RTLModel
}