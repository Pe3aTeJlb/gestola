import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { URI } from "@theia/core";

@injectable()
export class TestbenchesExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {

    let model = this.projManager.getCurrProject()?.getCurrRTLModel();
    if(model){
      return Promise.resolve(model.testbenchesFiles.sort((a, b) => {
        return a.path.name.localeCompare(b.path.name);
      }).map(i => this.makeTreeNode(i)));
    } else {
      return Promise.resolve([]);
    }
  }

    makeTreeNode(uri: URI) {
      const node: TestbenchTreeNode = {
        id: uri.path.fsPath(),
        name: uri.path.name,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        uri: uri
      };
      return node;
    }


 }

export interface TestbenchTreeNode extends CompositeTreeNode, SelectableTreeNode {
  uri: URI
}