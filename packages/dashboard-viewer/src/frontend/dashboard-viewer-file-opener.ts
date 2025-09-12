import {
    
    OpenWithService,
    WidgetOpenerOptions,
    WidgetOpenHandler,
    OpenWithHandler,
    ApplicationShell
} from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { DashboardViewerWidget, NavigatableDashboardViewerOptions } from './dashboard-viewer-widget';
import { EditorManager } from '@theia/editor/lib/browser';

@injectable()
export class DashboardViewerFileOpener extends WidgetOpenHandler<DashboardViewerWidget> implements OpenWithHandler {

    @inject(OpenWithService)
    protected openWithService: OpenWithService;
    
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    fileExtensions: string[] = ['.dashboard'];

    protected registerOpenWithHandler = true;

    override get id(): string {
        return DashboardViewerWidget.ID;
    }

    @postConstruct()
    protected override init(): void {
        super.init();
        if (this.registerOpenWithHandler) {
            this.openWithService.registerHandler(this);
        }
    }

    /*
    override async open(uri: URI, options?: WidgetOpenerOptions): Promise<DashboardViewerWidget> {

        let widget;
        if(this.all.length > 0){
            widget = this.all[0];
        } else {
            widget = await this.getOrCreateWidget(uri, options);
        }
        await this.doOpen(widget, uri, options);
        return widget;
    }*/

    override async doOpen(widget: DashboardViewerWidget, uri: URI, maybeOptions?: WidgetOpenerOptions): Promise<void> {
        const options: WidgetOpenerOptions = {
            mode: 'reveal',
            ...maybeOptions
        };
        if (!widget.isAttached) {
            await this.shell.addWidget(widget, options.widgetOptions || { area: 'main' });
        }
        if (options.mode === 'activate') {
            await this.shell.activateWidget(widget.id);
        } else if (options.mode === 'reveal') {
            await this.shell.revealWidget(widget.id);
        }
    }

    protected attachWidget(widget: DashboardViewerWidget, options?: WidgetOpenerOptions): void {
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

    protected override createWidgetOptions(uri: URI, options: WidgetOpenerOptions): NavigatableDashboardViewerOptions {
        return {
            uri: uri.withoutFragment()
        };
    }

    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        if (uri.path.toString().endsWith(this.fileExtensions[0])) {
            return 1000;
        }
        return 0;
    }

}

