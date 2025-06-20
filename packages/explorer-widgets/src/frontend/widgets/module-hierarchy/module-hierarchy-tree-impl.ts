import {TreeImpl,CompositeTreeNode,TreeNode,SelectableTreeNode, ExpandableTreeNode } from "@theia/core/lib/browser";
import { inject, injectable } from "@theia/core/shared/inversify";
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { HDLFileDescription } from "@gestola/project-manager/lib/frontend/project-manager/rtl-model";

@injectable()
export class ModuleHierarchyTreeImpl extends TreeImpl {

  @inject(ProjectManager) 
  protected readonly projManager: ProjectManager;

  protected override resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> { 

    if (ModuleTreeRootNode.is(parent)) {
      let rtlMode = this.projManager.getCurrRTLModel();
      if(rtlMode && rtlMode.topLevelModule){
        return Promise.resolve(
          rtlMode.hdlFilesDescription.filter(e => rtlMode?.topLevelModule?.uri.isEqual(e.uri) && rtlMode.topLevelModule.name == e.module.name).map(e => this.makeTreeNode(e))
        );
      } else {
        return Promise.resolve([]);
      }
    }

    if (ModuleTreeNode.is(parent)) {
      let rtlModel = this.projManager.getCurrRTLModel();
      if(rtlModel){
        return Promise.resolve(
          rtlModel.hdlFilesDescription.filter(e => parent.fileDesc?.module.dependencies?.includes(e.module.name))
          .filter(e => rtlModel?.designIncludedHDLFiles.find(i => i.isEqual(e.uri)) !== undefined).map(i => this.makeTreeNode(i))
        );
      }
    }

    if (ModuleTreeTerminalNode.is(parent)) {
      return Promise.resolve([]);
    }

    return super.resolveChildren(parent);

  }

    makeTreeNode(fileDesc: HDLFileDescription) {
      let node: ModuleTreeNode | ModuleTreeTerminalNode;
      fileDesc.module.dependencies ?
      node = {
        id: fileDesc.uri.path.toString() + " - " + fileDesc.module.name,
        name: fileDesc.module.name,
        parent: undefined,
        selected: false,
        visible: true,
        expanded: true,
        children: [],
        fileDesc: fileDesc
      } as ModuleTreeNode:
      node = {
        id: fileDesc.uri.path.toString() + " - " + fileDesc.module.name,
        name: fileDesc.module.name,
        parent: undefined,
        selected: false,
        visible: true,
        children: [],
        fileDesc: fileDesc
      } as ModuleTreeTerminalNode;
      return node;
    }


 }

export interface ModuleTreeRootNode extends CompositeTreeNode {
  children: ModuleTreeNode[];
}

export namespace ModuleTreeRootNode {

  export const id = 'ModuleTreeRootNodeId';
  export const name = 'ModuleTreeRootNode';

  export function is(node: TreeNode | undefined): node is ModuleTreeRootNode {
      return CompositeTreeNode.is(node) && node.id === ModuleTreeRootNode.id;
  }

  /**
   * Create a `WorkspaceNode` that can be used as a `Tree` root.
   */
  export function createRoot(): ModuleTreeRootNode {
      return {
          id: ModuleTreeRootNode.id,
          name: ModuleTreeRootNode.name,
          parent: undefined,
          children: [],
          visible: false
      };
  }
}

export interface ModuleTreeNode extends CompositeTreeNode, SelectableTreeNode, ExpandableTreeNode {
  children: ModuleTreeNode[];
  fileDesc: HDLFileDescription | undefined
}

export namespace ModuleTreeNode {
  export function is(node: object): node is ModuleTreeNode {
    return !!node && "fileDesc" in node;
  }
}

export interface ModuleTreeTerminalNode extends CompositeTreeNode, SelectableTreeNode {
  children: ModuleTreeNode[];
  fileDesc: HDLFileDescription | undefined
}

export namespace ModuleTreeTerminalNode {
  export function is(node: object): node is ModuleTreeNode {
    return !!node && "fileDesc" in node && (node.fileDesc as HDLFileDescription).module.dependencies?.length == 0;
  }
}