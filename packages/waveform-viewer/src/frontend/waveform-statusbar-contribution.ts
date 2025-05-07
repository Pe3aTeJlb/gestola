import { injectable } from '@theia/core/shared/inversify';
import { DisposableCollection, nls } from '@theia/core';
import { StatusBar, StatusBarAlignment, Widget, WidgetStatusBarContribution } from '@theia/core/lib/browser';
import * as monaco from '@theia/monaco-editor-core';
import { WaveformViewerWidget } from './waveform-widget/waveform-viewer-widget';

export const EDITOR_STATUS_TABBING_CONFIG = 'editor-status-tabbing-config';
export const EDITOR_STATUS_EOL = 'editor-status-eol';

@injectable()
export class WaveformViewerStatusBarContribution implements WidgetStatusBarContribution<WaveformViewerWidget> {

    protected readonly toDispose = new DisposableCollection();

    canHandle(widget: Widget): widget is WaveformViewerWidget {
        if (widget instanceof WaveformViewerWidget) {
            return true;
        }
        return false;
    }

    activate(statusBar: StatusBar, widget: WaveformViewerWidget): void {
        this.toDispose.dispose();
        /*const editorModel = this.getModel(widget);
        if (editorModel) {
            this.setConfigTabSizeWidget(statusBar, editorModel);
            this.setLineEndingWidget(statusBar, editorModel);
            this.toDispose.push(editorModel.onDidChangeOptions(() => {
                this.setConfigTabSizeWidget(statusBar, editorModel);
                this.setLineEndingWidget(statusBar, editorModel);
            }));
            let previous = editorModel.getEOL();
            this.toDispose.push(editorModel.onDidChangeContent(e => {
                if (previous !== e.eol) {
                    previous = e.eol;
                    this.setLineEndingWidget(statusBar, editorModel);
                }
            }));
        } else {
            this.deactivate(statusBar);
        }*/
    }

    deactivate(statusBar: StatusBar): void {
        this.toDispose.dispose();
        this.removeConfigTabSizeWidget(statusBar);
        this.removeLineEndingWidget(statusBar);
    }

    protected setConfigTabSizeWidget(statusBar: StatusBar, model: monaco.editor.ITextModel): void {
        const modelOptions = model.getOptions();
        const tabSize = modelOptions.tabSize;
        const indentSize = modelOptions.indentSize;
        const spaceOrTabSizeMessage = modelOptions.insertSpaces
            ? nls.localizeByDefault('Spaces: {0}', indentSize)
            : nls.localizeByDefault('Tab Size: {0}', tabSize);
        statusBar.setElement(EDITOR_STATUS_TABBING_CONFIG, {
            text: spaceOrTabSizeMessage,
            alignment: StatusBarAlignment.RIGHT,
            priority: 10,
            //command: EditorCommands.CONFIG_INDENTATION.id,
            tooltip: nls.localizeByDefault('Select Indentation')
        });
    }

    protected removeConfigTabSizeWidget(statusBar: StatusBar): void {
        statusBar.removeElement(EDITOR_STATUS_TABBING_CONFIG);
    }

    protected setLineEndingWidget(statusBar: StatusBar, model: monaco.editor.ITextModel): void {
        const eol = model.getEOL();
        const text = eol === '\n' ? 'LF' : 'CRLF';
        statusBar.setElement(EDITOR_STATUS_EOL, {
            text: `${text}`,
            alignment: StatusBarAlignment.RIGHT,
            priority: 11,
            //command: EditorCommands.CONFIG_EOL.id,
            tooltip: nls.localizeByDefault('Select End of Line Sequence')
        });
    }

    protected removeLineEndingWidget(statusBar: StatusBar): void {
        statusBar.removeElement(EDITOR_STATUS_EOL);
    }

}