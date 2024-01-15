import * as React from 'react';
import { injectable, postConstruct, inject } from '@theia/core/shared/inversify';
import { AlertMessage } from '@theia/core/lib/browser/widgets/alert-message';
import { MessageService } from '@theia/core';
import { Message, TreeWidget } from '@theia/core/lib/browser';
import {
    ContextMenuRenderer,
    TreeModel,
    TreeProps,
    TreeNode,
    ExpandableTreeNode
  } from "@theia/core/lib/browser";

@injectable()
export class ProjectsExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola-core:gestola-project-explorer';
    static readonly LABEL = 'Gestola Projects Explorer';

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TreeModel) readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
    ){

        super(props, model, contextMenuRenderer);

    }

}
