import { codiconCSSString } from '@eclipse-glsp/client';
import {
    ApplicationShell,
    OpenWithHandler,
    OpenWithService,
    WidgetOpenerOptions,
    WidgetOpenHandler
} from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { NodeRedIntegrationWidget } from './node-red-integration-widget';
import { NodeRedContribution } from '../common/node-red-contribution';

@injectable()
export class NodeRedFileOpener extends WidgetOpenHandler<NodeRedIntegrationWidget> implements OpenWithHandler {
    
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    @inject(OpenWithService)
    protected openWithService: OpenWithService;

    @inject(NodeRedContribution.Service)
    private readonly nodeRedContribution: NodeRedContribution;

    fileExtensions: string[] = ['.df'];

    protected widgetCount = 0;

    protected registerOpenWithHandler = true;

    @postConstruct()
    protected override init(): void {
        super.init();
        if (this.registerOpenWithHandler) {
            this.openWithService.registerHandler(this);
        }
    }

    protected override createWidgetOptions(uri: URI, options?: WidgetOpenerOptions | undefined): Object {
        return {};
    }

    override async doOpen(widget: NodeRedIntegrationWidget, maybeOptions?: WidgetOpenerOptions): Promise<void> {
        const options: WidgetOpenerOptions = {
            mode: 'activate',
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
        if (!!currentEditor) {
            widgetOptions.ref = currentEditor;
            widgetOptions.mode =
                options && options.widgetOptions && options.widgetOptions.mode ? options.widgetOptions.mode : 'open-to-right';
        }
        this.shell.addWidget(widget, widgetOptions);
    }

    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        for (const extension of this.fileExtensions) {
            if (uri.path.toString().endsWith(extension)) {
                this.nodeRedContribution.openFile();
                return 1001;
            }
        }
        return 0;
    }

    override get id(): string {
        return NodeRedIntegrationWidget.ID;
    }

    get iconClass(): string {
        return codiconCSSString('type-hierarchy-sub');
    }

    get providerName(): string | undefined {
        return undefined;
    }
}

