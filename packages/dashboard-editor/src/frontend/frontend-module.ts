import { ContainerModule } from '@theia/core/shared/inversify';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import '@gestola/react-chart-editor/style/index.css';
import '@gestola/react-chart-editor/style/index2.css';
import '@gestola/react-chart-editor/style/style.css';
import '@gestola/react-chart-editor/style/style2.css';
import 'react-chart-editor/lib/react-chart-editor.css';
import { DashboardEditorWidgetContribution } from './dashboard-editor-contribution';
import { DashboardEditorWidget } from './dashboard-editor-widget';
import { DatasetSelectorCommandsContribution } from './dataset-selector/dataset-selector-commands-contribution';
import { CommandContribution } from "@theia/core";
import { TabBarToolbarContribution } from "@theia/core/lib/browser/shell/tab-bar-toolbar";
import { NavigatableDashboardEditorOptions } from './base/navigatable-dashboard-editor-widget';
import URI from '@theia/core/lib/common/uri';
import { NavigatableWidgetOptions } from '@theia/core/lib/browser';
import { ChartEditorWidget } from './chart-editor/react-chart-editor-widget';
import { DataPreviewWidget } from './data-preview/data-preview-widget';
import { interfaces } from 'inversify';
import { BaseDashboardEditorWidget } from './base/dashboard-editor-base';
import { DatasetSelectorWidget } from './dataset-selector/dataset-selector-widget';
import { DashboardEditorFileOpener } from './dashboard-editor-file-opener';
import {  FrontendApplicationContribution} from '@theia/core/lib/browser';
import { OpenHandler } from '@theia/core/lib/browser';

export default new ContainerModule(bind => {

    bind(DatasetSelectorCommandsContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(DatasetSelectorCommandsContribution);
    bind(TabBarToolbarContribution).toService(DatasetSelectorCommandsContribution);

    bind(DashboardEditorFileOpener).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DashboardEditorFileOpener);
    bind(OpenHandler).toService(DashboardEditorFileOpener);

    bind(DatasetSelectorWidget).toSelf();

    bindViewContribution(bind, DashboardEditorWidgetContribution);
    bind(DashboardEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: DashboardEditorWidget.ID,
        createWidget: (options: NavigatableWidgetOptions) => {
            const container = createContainer(context.container, DashboardEditorWidget);
            if(options && options.uri){
                const uri = new URI(options.uri);
                container.bind(NavigatableDashboardEditorOptions).toConstantValue({ uri });
            } else {
                container.bind(NavigatableDashboardEditorOptions).toConstantValue({ uri: undefined });
            }
            return container.get(DashboardEditorWidget);
        }
    })).inSingletonScope();

});

export function createContainer(
    parent: interfaces.Container,
    dashboardEditor: interfaces.Newable<BaseDashboardEditorWidget>,
): interfaces.Container {
    const container = parent.createChild();
    container.bind(DatasetSelectorWidget).toDynamicValue(context => DatasetSelectorWidget.createWidget(context.container)).inSingletonScope();
    container.bind(ChartEditorWidget).toSelf();
    container.bind(DataPreviewWidget).toSelf();
    //container.bind(DatasetSelectorWidget).toDynamicValue(context => createTreeWidget(context.container)).inSingletonScope();
    container.bind(dashboardEditor).toSelf();
    return container;
}
