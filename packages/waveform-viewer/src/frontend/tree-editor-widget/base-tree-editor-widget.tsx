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
import { Title } from '@lumino/widgets';
import { BaseWidget, Message, SplitPanel, Widget } from '@theia/core/lib/browser';
import { ILogger } from '@theia/core/lib/common';
import { injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { TreeEditor } from './interfaces';
import { TreeWidget } from '@theia/core/lib/browser/tree/tree-widget';

@injectable()
export abstract class BaseTreeEditorWidget extends BaseWidget {

    private splitPanel: SplitPanel;

    public selectedNode: TreeEditor.Node;

    protected instanceData: any;

    constructor(
        protected readonly treeWidget: TreeWidget,
        protected readonly waveformWidget: BaseWidget,
        protected readonly logger: ILogger,
        readonly widgetId: string
    ) {
        super();
        this.id = widgetId;
        this.splitPanel = new SplitPanel();
        //this.addClass(BaseTreeEditorWidget.Styles.EDITOR);
        this.splitPanel.addClass(BaseTreeEditorWidget.Styles.SASH);
        //this.treeWidget.addClass(BaseTreeEditorWidget.Styles.TREE);
        //this.viewerWidget.addClass(BaseTreeEditorWidget.Styles.FORM);
    }

    @postConstruct()
    protected init(): void {
        this.configureTitle(this.title);
    }

    protected override onResize(_msg: any): void {
        if (this.splitPanel) {
            this.splitPanel.update();
        }
    }

    protected renderError(errorMessage: string): void {
        const root = createRoot(this.waveformWidget.node);
        root.render(<React.Fragment>{errorMessage}</React.Fragment>);
    }


    protected override onAfterAttach(msg: Message): void {
        this.splitPanel.addWidget(this.treeWidget);
        this.splitPanel.addWidget(this.waveformWidget);
        this.splitPanel.setRelativeSizes([1, 4]);
        Widget.attach(this.splitPanel, this.node);
        this.treeWidget.activate();
        this.waveformWidget.activate();
        super.onAfterAttach(msg);
    }

    protected override onActivateRequest(): void {
        if (this.splitPanel) {
            this.splitPanel.node.focus();
        }
    }

    /**
     * Configure this editor's title tab by configuring the given Title object.
     *
     * @param title The title object configuring this editor's title tab in Theia
     */
    protected abstract configureTitle(title: Title<Widget>): void;
}

// eslint-disable-next-line no-redeclare
export namespace BaseTreeEditorWidget {
    export const WIDGET_LABEL = 'Waveform Viewer';

    export namespace Styles {
        export const EDITOR = 'theia-tree-editor';
        export const TREE = 'theia-tree-editor-tree';
        export const FORM = 'theia-tree-editor-form';
        export const SASH = 'theia-tree-editor-sash';
    }
}
