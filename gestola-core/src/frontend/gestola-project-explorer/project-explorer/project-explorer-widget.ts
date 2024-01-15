import { injectable, inject } from '@theia/core/shared/inversify';
import { nls } from '@theia/core';
import { TreeWidget } from '@theia/core/lib/browser';
import {
    ContextMenuRenderer,
    TreeModel,
    TreeProps,
  } from "@theia/core/lib/browser";

@injectable()
export class ProjectExplorerWidget extends TreeWidget {

    static readonly ID = 'gestola-core:gestola-project-explorer';
    static readonly LABEL = nls.localize("gestola-core/gestola-project-explorer/project-explorer", "Gestola: Project Explorer");

    constructor(
        @inject(TreeProps) readonly props: TreeProps,
        @inject(TreeModel) readonly model: TreeModel,
        @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
    ){

        super(props, model, contextMenuRenderer);

    }

}
