import {
    
    OpenWithService,
    OpenWithHandler,
    WidgetOpenerOptions,
    WidgetOpenHandler,
} from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { NavigatableWaveformViewerOptions } from './tree-editor-widget/navigatable-waveform-viewer-widget';
import { WaveformViewerWidget } from './waveform-widget/waveform-viewer-widget';

@injectable()
export class WaveformFileOpener extends WidgetOpenHandler<WaveformViewerWidget> implements OpenWithHandler {

    @inject(OpenWithService)
    protected openWithService: OpenWithService;

    fileExtensions: string[] = ['.fst','.vcd', '.ghw'];

    protected registerOpenWithHandler = true;

    override get id(): string {
        return WaveformViewerWidget.ID;
    }

    @postConstruct()
    protected override init(): void {
        super.init();
        if (this.registerOpenWithHandler) {
            this.openWithService.registerHandler(this);
        }
    }

    protected override createWidgetOptions(uri: URI, options: WidgetOpenerOptions): NavigatableWaveformViewerOptions {
        return {
            uri: uri.withoutFragment()
        };
    }

    protected override async doOpen(widget: WaveformViewerWidget, uri: URI, options?: WidgetOpenerOptions): Promise<void> {
        const op: WidgetOpenerOptions = {
            mode: 'reveal',
            ...options
        };
        if (!widget.isAttached) {
            await this.shell.addWidget(widget, op.widgetOptions || { area: 'main' });
        }
        if (op.mode === 'activate') {
            await this.shell.activateWidget(widget.id);
        } else if (op.mode === 'reveal') {
            await this.shell.revealWidget(widget.id);
        }
    }


    canHandle(uri: URI, _options?: WidgetOpenerOptions | undefined): number {
        for (const extension of this.fileExtensions) {
            if (uri.path && uri.path.toString().endsWith(extension)) {
                return 1001;
            }
        }
        return 0;
    }

}

