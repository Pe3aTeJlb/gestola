import {
  ContextMenuRenderer,
  TreeModel,
  TreeProps,
  TreeWidget,
  TreeNode,
  ExpandableTreeNode
} from "@theia/core/lib/browser";
import { inject, injectable } from "inversify";
import { FamilyRootNode, MemberNode } from "./family-tree";

@injectable()
export class FamilyTreeWidget extends TreeWidget {
  static readonly ID = "family-tree-widget";
  static readonly LABEL = "Family Tree";

  constructor(
    @inject(TreeProps) readonly props: TreeProps,
    @inject(TreeModel) readonly model: TreeModel,
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
  ) {
    super(props, model, contextMenuRenderer);

    this.title.label = FamilyTreeWidget.LABEL;
    this.id = FamilyTreeWidget.ID;

    const family: Family = {
      name: "Vestrit",
      members: [
        {
          firstName: "Ephron",
          nickName: "Ephy",
          children: [
            {
              firstName: "Keffria",
              nickName: "Keff",
              children: [
                {
                  firstName: "Wintrow",
                  nickName: "Win"
                },
                {
                  firstName: "Malta",
                  nickName: "Ederling Queen",
                  children: [
                    {
                      firstName: "Ephron Bendir",
                      nickName: "Ben"
                    }
                  ]
                },
                {
                  firstName: "Selden",
                  nickName: "Ederling Prince"
                }
              ]
            },
            {
              firstName: "Althea",
              nickName: "Alth"
            }
          ]
        }
      ]
    };

    const root: FamilyRootNode = {
      id: "family-root",
      name: "family-root",
      visible: false,
      parent: undefined,
      children: [],
      family
    };

    this.model.root = root;
  }

  protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
    if (FamilyRootNode.is(node)) return true;

    if (MemberNode.is(node) && node.member.children)
      return node.member.children.length > 0;

    return false;
  }
}
