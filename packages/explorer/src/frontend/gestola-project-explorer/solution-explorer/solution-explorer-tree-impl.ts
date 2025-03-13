import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { Solution } from "@gestola/project-manager/src/frontend/project-manager/solution";

@injectable()
export class SolutionExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> { 
    let proj = this.projManager.getCurrProject();
    if(proj){
    
      return Promise.resolve(proj.solutions.sort((a, b) => {
        return a.solutionName.localeCompare(b.solutionName);
      }).map(i => this.makeTreeNode(i)));

    } else {
      return Promise.resolve([]);
    }

  }

    makeTreeNode(sol: Solution) {
      const node: SolutionTreeNode = {
        id: sol.solutionName,
        name: sol.solutionName,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        solution: sol
      };
      return node;
    }


 }

export interface SolutionTreeNode extends CompositeTreeNode, SelectableTreeNode {
  solution: Solution
}