import {
    
    OpenWithService,
    WidgetOpenerOptions,
    WidgetOpenHandler,
    OpenWithHandler,
    NavigatableWidgetOptions,
    ApplicationShell
} from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { EditorManager } from '@theia/editor/lib/browser';
import { NodeRedService } from '../common/protocol';

export const NodeRedIntegrationOptions = Symbol('NodeRedIntegrationOptions');
export interface NodeRedIntegrationOptions extends NavigatableWidgetOptions {
}

@injectable()
export class NodeRedFileOpener extends WidgetOpenHandler<NodeRedIntegrationWidget> implements OpenWithHandler {

    @inject(OpenWithService)
    protected openWithService: OpenWithService;
    
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(NodeRedService)
    private readonly nodeRedService: NodeRedService;

    fileExtensions: string[] = ['.df','.json'];

    protected registerOpenWithHandler = true;

    override get id(): string {
        return NodeRedIntegrationWidget.ID;
    }

    @postConstruct()
    protected override init(): void {
        super.init();
        if (this.registerOpenWithHandler) {
            this.openWithService.registerHandler(this);
        }
    }

    override async open(uri: URI, options?: WidgetOpenerOptions): Promise<NodeRedIntegrationWidget> {

        let widget;
        if(this.all.length > 0){
            widget = this.all[0];
        } else {
            widget = await this.getOrCreateWidget(uri, options);
        }
        this.nodeRedService.openFile(uri);
        await this.doOpen(widget, options);
        return widget;
    }

    override async doOpen(widget: NodeRedIntegrationWidget, maybeOptions?: WidgetOpenerOptions): Promise<void> {
        const options: WidgetOpenerOptions = {
            mode: 'reveal',
            ...maybeOptions
        };
        if (!widget.isAttached) {
            this.attachWidget(widget, options);
        }
        if (options.mode === 'activate') {
            await this.shell.activateWidget(widget.id);
        } else if (options.mode === 'reveal') {
            await this.shell.revealWidget(widget.id);
        }
    }

    protected attachWidget(widget: NodeRedIntegrationWidget, options?: WidgetOpenerOptions): void {
        const currentEditor = this.editorManager.currentEditor;
        const widgetOptions: ApplicationShell.WidgetOptions = {
            area: 'main',
            ...(options && options.widgetOptions ? options.widgetOptions : {})
        };
        if (!!currentEditor && currentEditor.editor.uri.toString(true) === widget.uri.toString(true)) {
            widgetOptions.ref = currentEditor;
            widgetOptions.mode =
                options && options.widgetOptions && options.widgetOptions.mode ? options.widgetOptions.mode : 'open-to-right';
        }
        this.shell.addWidget(widget, widgetOptions);
    }

    protected override createWidgetOptions(uri: URI, options: WidgetOpenerOptions): NodeRedIntegrationOptions {
        return {
            kind: 'navigatable',
            uri: uri.toString()
        };
    }

    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        if (uri.path.toString().endsWith(this.fileExtensions[0])) {
            return 1001;
        }
        if (uri.path.toString().endsWith(this.fileExtensions[1])) {
            return 1;
        }
        return 0;
    }

}

