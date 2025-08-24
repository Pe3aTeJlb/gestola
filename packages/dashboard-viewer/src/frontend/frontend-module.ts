import { ContainerModule } from '@theia/core/shared/inversify';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import { DashboardViewerFileOpener } from './dashboard-viewer-file-opener';
import { OpenHandler } from '@theia/core/lib/browser';
import { FrontendApplicationContribution, NavigatableWidgetOptions} from '@theia/core/lib/browser';
import { DashboardViewerWidget, NavigatableDashboardViewerOptions } from './dashboard-viewer-widget';
import { DashboardViewerContribution } from './dashboard-viewer-contribution';
import '@gestola/react-chart-editor/style/index.css';
import '@gestola/react-chart-editor/style/index2.css';
import '@gestola/react-chart-editor/style/style.css';
import '@gestola/react-chart-editor/style/style2.css';
import URI from '@theia/core/lib/common/uri';

export default new ContainerModule(bind => {

    bindViewContribution(bind, DashboardViewerContribution);
    bind(FrontendApplicationContribution).toService(DashboardViewerContribution);

    bind(DashboardViewerFileOpener).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(DashboardViewerFileOpener);
    bind(OpenHandler).toService(DashboardViewerFileOpener);

    bind(DashboardViewerWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: DashboardViewerWidget.ID,
        createWidget: (options: NavigatableWidgetOptions) => {
            const uri = new URI(options.uri);
            const child = ctx.container.createChild();
            child.bind(NavigatableDashboardViewerOptions).toConstantValue({uri});
            return child.get(DashboardViewerWidget);
        }
    }));

});
