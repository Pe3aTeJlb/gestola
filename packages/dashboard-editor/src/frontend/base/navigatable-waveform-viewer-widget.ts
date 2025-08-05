/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 *******************************************************************************/
import { ILogger } from '@theia/core';
import { Navigatable, Title, Widget, BaseWidget } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { TreeWidget } from '@theia/core/lib/browser/tree/tree-widget';
import { BaseDashboardEditorWidget } from './dashboard-editor-base';

export const NavigatableDashboardEditorOptions = Symbol('NavigatableDashboardEditorOptions');
export interface NavigatableDashboardEditorOptions {
    uri: URI | undefined;
}

export abstract class NavigatableDashboardEditorWidget extends BaseDashboardEditorWidget implements Navigatable {
    
    constructor(
        protected override readonly treeWidget: TreeWidget,
        protected override readonly chartEditorWidget: BaseWidget,
        protected override readonly dataPreviewWidget: BaseWidget,
        protected override readonly logger: ILogger,
        readonly widget_id: string,
        protected readonly options: NavigatableDashboardEditorOptions
    ) {
        super(treeWidget, chartEditorWidget, dataPreviewWidget, logger, widget_id);
    }

    /** The uri of the editor's resource. */
    get uri(): URI | undefined {
        return this.options.uri;
    }

    getResourceUri(): URI | undefined {
        return this.uri;
    }

    createMoveToUri(resourceUri: URI): URI | undefined {
        return this.options.uri && this.options.uri.withPath(resourceUri.path);
    }

    protected configureTitle(title: Title<Widget>): void {
        if(this.options.uri){
            title.label = this.options.uri.path.base;
            title.caption = this.options.uri.toString();
        }
        title.closable = true;
    }
}
