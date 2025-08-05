import { Title } from '@lumino/widgets';
import { BaseWidget, Message, SplitPanel, Widget } from '@theia/core/lib/browser';
import { ILogger } from '@theia/core/lib/common';
import { injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { TreeWidget } from '@theia/core/lib/browser/tree/tree-widget';

@injectable()
export abstract class BaseDashboardEditorWidget extends BaseWidget {

    private horSplitPanel: SplitPanel;
    private vertSplitPanel: SplitPanel;

    protected instanceData: any;

    constructor(
        protected readonly treeWidget: TreeWidget,
        protected readonly chartEditorWidget: BaseWidget,
        protected readonly dataPreviewWidget: BaseWidget,
        protected readonly logger: ILogger,
        readonly widgetId: string
    ) {
        super();
        this.id = widgetId;
        this.horSplitPanel = new SplitPanel();
        this.vertSplitPanel = new SplitPanel({orientation: "vertical"});

        this.horSplitPanel.addClass(BaseDashboardEditorWidget.Styles.SASH);
        this.vertSplitPanel.addClass(BaseDashboardEditorWidget.Styles.SASH);

    }

    @postConstruct()
    protected init(): void {
        this.configureTitle(this.title);
    }

    protected override onResize(_msg: any): void {
        this.horSplitPanel.update();
        this.vertSplitPanel.update();
        this.chartEditorWidget.update();
    }

    protected renderError(errorMessage: string): void {
        const root = createRoot(this.node);
        root.render(<React.Fragment>{errorMessage}</React.Fragment>);
    }


    protected override onAfterAttach(msg: Message): void {

        this.horSplitPanel.addWidget(this.treeWidget);
        this.horSplitPanel.addWidget(this.vertSplitPanel);

        this.vertSplitPanel.addWidget(this.chartEditorWidget);
        this.vertSplitPanel.addWidget(this.dataPreviewWidget);

        Widget.attach(this.horSplitPanel, this.node);

        this.treeWidget.activate();
        this.chartEditorWidget.activate();
        this.dataPreviewWidget.activate();

        this.horSplitPanel.handleMoved.connect(() => {this.chartEditorWidget.update()});
        this.vertSplitPanel.handleMoved.connect(() => {this.chartEditorWidget.update()});

        super.onAfterAttach(msg);

        this.horSplitPanel.setRelativeSizes([0.1, 0.9], true);
        this.vertSplitPanel.setRelativeSizes([0.9, 0.1], true);

    }

    protected override onActivateRequest(): void {
        if (this.horSplitPanel) {
            this.horSplitPanel.node.focus();
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
export namespace BaseDashboardEditorWidget {
    export const WIDGET_LABEL = 'Dashboard Editor';

    export namespace Styles {
        export const EDITOR = 'theia-tree-editor';
        export const TREE = 'theia-tree-editor-tree';
        export const FORM = 'theia-tree-editor-form';
        export const SASH = 'theia-tree-editor-sash';
    }
}
