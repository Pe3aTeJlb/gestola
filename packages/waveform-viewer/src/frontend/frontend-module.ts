import '../../src/frontend/style/style.css';
import '../../src/frontend/style/index.css';

import { ContainerModule } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution,  LabelProviderContribution,  NavigatableWidgetOptions} from '@theia/core/lib/browser';
import { WidgetFactory } from '@theia/core/lib/browser';
import { OpenHandler } from '@theia/core/lib/browser';
import { WaveformFileOpener } from './waveform-file-opener';
import { WaveformWidget } from './waveform-widget/waveform-widget';
import { WaveformViewerLabelProviderContribution } from './label-provider';
import { WaveformViewerWidget } from './waveform-widget/waveform-viewer-widget';
import { NavigatableWaveformViewerOptions } from './tree-editor-widget/navigatable-waveform-viewer-widget';
import { createTreeContainer, defaultTreeProps, TreeProps, TreeWidget } from '@theia/core/lib/browser/tree';
import { interfaces } from 'inversify';
import URI from '@theia/core/lib/common/uri';
import { NetlistTreeWidget } from './waveform-widget/netlist-tree-widget';
import { BaseTreeEditorWidget } from './tree-editor-widget/base-tree-editor-widget';
import { WAVEFROM_VIEWER_BACKEND_PATH, WaveformViewerBackendService } from '../common/protocol';
import { WebSocketConnectionProvider } from '@theia/core/lib/browser';
import { DocumentWatcher } from '../common/document-watcher';

export default new ContainerModule(bind => {

    bind(WaveformFileOpener).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(WaveformFileOpener);
    bind(OpenHandler).toService(WaveformFileOpener);

    bind(WaveformViewerLabelProviderContribution).toSelf().inSingletonScope();
    bind(LabelProviderContribution).toService(WaveformViewerLabelProviderContribution);

    bind(WidgetFactory).toDynamicValue(context => ({
        id: WaveformViewerWidget.ID,
        createWidget: (options: NavigatableWidgetOptions) => {
            const uri = new URI(options.uri);
            const container = createContainer(context.container, WaveformViewerWidget);
            container.bind(NavigatableWaveformViewerOptions).toConstantValue({ uri });
            return container.get(WaveformViewerWidget);
        }
    })).inSingletonScope();


    bind(DocumentWatcher).toSelf().inSingletonScope();
    bind(WaveformViewerBackendService).toDynamicValue(ctx => {
        const connection = ctx.container.get(WebSocketConnectionProvider);
        const documentWatcher = ctx.container.get(DocumentWatcher);
        return connection.createProxy<WaveformViewerBackendService>(WAVEFROM_VIEWER_BACKEND_PATH, documentWatcher.getFrontendService());
    }).inSingletonScope();

});

export const TREE_PROPS = {
    ...defaultTreeProps,
    virtualized: false,
    multiSelect: true,
    search: false,
    expandOnlyOnExpansionToggleClick: true
} as TreeProps;

function createTreeWidget(container: interfaces.Container): NetlistTreeWidget {

    const treeContainer = createTreeContainer(container);

    treeContainer.unbind(TreeWidget);
    treeContainer.bind(NetlistTreeWidget).toSelf();
    treeContainer.rebind(TreeProps).toConstantValue(TREE_PROPS);

    return treeContainer.get(NetlistTreeWidget);

}

export function createContainer(
    parent: interfaces.Container,
    treeEditorWidget: interfaces.Newable<BaseTreeEditorWidget>,
): interfaces.Container {
    const container = parent.createChild();
    container.bind(WaveformWidget).toSelf();
    container.bind(NetlistTreeWidget).toDynamicValue(context => createTreeWidget(context.container)).inSingletonScope();
    container.bind(treeEditorWidget).toSelf();
    return container;
}
