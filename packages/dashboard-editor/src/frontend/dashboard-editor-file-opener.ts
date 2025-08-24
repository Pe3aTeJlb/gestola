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
import { EditorManager } from '@theia/editor/lib/browser';
import { DashboardEditorWidget } from './dashboard-editor-widget';

export const DashboardViewerOptions = Symbol('DashboardViewerOptions');
export interface DashboardViewerOptions extends NavigatableWidgetOptions {
}

@injectable()
export class DashboardEditorFileOpener extends WidgetOpenHandler<DashboardEditorWidget> implements OpenWithHandler {

    @inject(OpenWithService)
    protected openWithService: OpenWithService;
    
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

    fileExtensions: string[] = ['.dashboard'];

    protected registerOpenWithHandler = true;

    override get id(): string {
        return DashboardEditorWidget.ID;
    }

    @postConstruct()
    protected override init(): void {
        super.init();
        if (this.registerOpenWithHandler) {
            this.openWithService.registerHandler(this);
        }
    }

    override async open(uri: URI, options?: WidgetOpenerOptions): Promise<DashboardEditorWidget> {

        let widget;
        if(this.all.length > 0){
            widget = this.all[0];
        } else {
            widget = await this.getOrCreateWidget(uri, options);
        }
        await this.doOpen(widget, uri, options);
        return widget;
    }

    override async doOpen(widget: DashboardEditorWidget, uri: URI, maybeOptions?: WidgetOpenerOptions): Promise<void> {
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

    protected attachWidget(widget: DashboardEditorWidget, options?: WidgetOpenerOptions): void {
        const currentEditor = this.editorManager.currentEditor;
        const widgetOptions: ApplicationShell.WidgetOptions = {
            area: 'main',
            ...(options && options.widgetOptions ? options.widgetOptions : {})
        };
        if (!!currentEditor && currentEditor.editor.uri.toString(true) === widget.uri!.toString(true)) {
            widgetOptions.ref = currentEditor;
            widgetOptions.mode =
                options && options.widgetOptions && options.widgetOptions.mode ? options.widgetOptions.mode : 'open-to-right';
        }
        this.shell.addWidget(widget, widgetOptions);
    }

    protected override createWidgetOptions(uri: URI, options: WidgetOpenerOptions): DashboardViewerOptions {
        return {
            kind: 'navigatable',
            uri: uri.toString()
        };
    }

    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        if (uri.path.toString().endsWith(this.fileExtensions[0])) {
            return 10;
        }
        return 0;
    }

}

