import { ContainerModule } from '@theia/core/shared/inversify';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import '../../src/frontend/style/index.css';
import 'react-chart-editor/lib/react-chart-editor.css';
import { DashboardEditorWidgetContribution } from './dashboard-editor-contribution';
import { DashboardEditorWidget } from './dashboard-editor-widget';

export default new ContainerModule(bind => {
    
    bindViewContribution(bind, DashboardEditorWidgetContribution);
    bind(DashboardEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: DashboardEditorWidget.ID,
        createWidget: () => {
            const child = ctx.container.createChild();
            const widget = child.get(DashboardEditorWidget);
            return widget;
        }
    }));


});
