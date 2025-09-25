import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import { EDAWidgetContribution } from './eda-widget-contribution';
import { EDAWidget } from './eda-widget';
import { BaseDashboardEditorWidget } from '@gestola/dashboard-editor/lib/frontend/base/dashboard-editor-base';
import { DataPreviewWidget } from '@gestola/dashboard-editor/lib/frontend/data-preview/data-preview-widget';
import { DatasetSelectorWidget } from '@gestola/dashboard-editor/lib/frontend/dataset-selector/dataset-selector-widget';
import { EDAChartEditorWidget } from './eda-chart-editor-widget';
import { NavigatableDashboardEditorOptions } from '@gestola/dashboard-editor/lib/frontend/base/navigatable-dashboard-editor-widget';

export default new ContainerModule(bind => {

    bindViewContribution(bind, EDAWidgetContribution);
    bind(EDAWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: EDAWidget.ID,
        createWidget: () => {
            const container = createContainer(context.container, EDAWidget);
            container.bind(NavigatableDashboardEditorOptions).toConstantValue({ uri: undefined });
            return container.get(EDAWidget);
        }
    })).inSingletonScope();

});

export function createContainer(
    parent: interfaces.Container,
    dashboardEditor: interfaces.Newable<BaseDashboardEditorWidget>,
): interfaces.Container {
    const container = parent.createChild();
    container.bind(DatasetSelectorWidget).toDynamicValue(context => DatasetSelectorWidget.createWidget(context.container)).inSingletonScope();
    container.bind(EDAChartEditorWidget).toSelf();
    container.bind(DataPreviewWidget).toSelf();
    //container.bind(DatasetSelectorWidget).toDynamicValue(context => createTreeWidget(context.container)).inSingletonScope();
    container.bind(dashboardEditor).toSelf();
    return container;
}