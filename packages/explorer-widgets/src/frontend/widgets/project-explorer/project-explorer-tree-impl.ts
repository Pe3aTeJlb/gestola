import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager';
import { Project } from '@gestola/project-manager';

@injectable()
export class ProjectExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {

    return Promise.resolve(this.projManager.getOpenedProjects().sort((a, b) => {
      if((a.isFavorite && b.isFavorite) || (!a.isFavorite && !b.isFavorite)){
        return a.name.localeCompare(b.name);	
      } else {
        return a.isFavorite ? -1 : 1;
      }
    }).map(i => this.makeTreeNode(i)));

  }

    makeTreeNode(proj: Project) {
      const node: ProjectTreeNode = {
        id: proj.name,
        name: proj.name,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        project: proj
      };
      return node;
    }


 }

export interface ProjectTreeNode extends CompositeTreeNode, SelectableTreeNode {
  project: Project
}