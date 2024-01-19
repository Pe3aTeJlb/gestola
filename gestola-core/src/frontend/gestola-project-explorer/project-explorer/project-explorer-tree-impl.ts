import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import { ProjectManager } from "../../project-manager/project-manager";
import { Project } from "../../project-manager/project";
  
@injectable()
export class ProjectExplorerTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {

    console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.log(parent.toString());
    console.log(this.projManager.toString());
    console.log(this.projManager.openedProjects.toString());
    console.log(this.projManager.openedProjects.sort((a, b) => {
      if((a.isFavorite && b.isFavorite) || (!a.isFavorite && !b.isFavorite)){
        return a.projName.localeCompare(b.projName);	
      } else {
        return a.isFavorite ? -1 : 1;
      }
    }).map(i => this.makeTreeNode(i)));
    console.log("??????????????????");

    return Promise.resolve(this.projManager.openedProjects.sort((a, b) => {
      if((a.isFavorite && b.isFavorite) || (!a.isFavorite && !b.isFavorite)){
        return a.projName.localeCompare(b.projName);	
      } else {
        return a.isFavorite ? -1 : 1;
      }
    }).map(i => this.makeTreeNode(i)));

   /* if (FamilyRootNode.is(parent)) {
      return Promise.resolve(
        parent.family.members.map(m => this.makeMemberNode(m))
      );
    }

    if (MemberNode.is(parent) && parent.children) {
      return Promise.resolve(
        parent.member.children?.map(m => this.makeMemberNode(m)) || []
      );
    }

    return Promise.resolve(Array.from(parent.children));*/

  }

    makeTreeNode(proj: Project) {
      const node: ProjectTreeItem = {
        id: proj.projName,
        name: proj.projName,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        project: proj
      };
      return node;
    }


 }

export interface ProjectTreeItem extends CompositeTreeNode, SelectableTreeNode {
  project: Project
}