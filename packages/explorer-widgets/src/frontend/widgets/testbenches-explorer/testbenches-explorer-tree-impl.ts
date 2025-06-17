import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { HDLModuleRef } from "@gestola/project-manager/src/frontend/project-manager/rtl-model";

@injectable()
export class TestBenchExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {

    let model = this.projManager.getCurrProject()?.getCurrRTLModel();
    if(model){
      return Promise.resolve(model.testbenchesFiles.sort((a, b) => {
        return a.uri.path.name.localeCompare(b.uri.path.name);
      }).map(i => this.makeTreeNode(i)));
    } else {
      return Promise.resolve([]);
    }
  }

    makeTreeNode(module: HDLModuleRef) {
      const node: TestbenchTreeNode = {
        id: module.uri.path.fsPath(),
        name: `${module.uri.path.name} (${module.name})`,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        module: module
      };
      return node;
    }


 }

export interface TestbenchTreeNode extends CompositeTreeNode, SelectableTreeNode {
  module: HDLModuleRef
}