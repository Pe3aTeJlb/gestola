import { ContainerModule } from '@theia/core/shared/inversify';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import '../../src/frontend/style/index.css';
import 'react-chart-editor/lib/react-chart-editor.css';
import { DashboardWidgetEditorContribution } from './dashboard-widget-editor-contribution';
import { DashboardWidgetEditorWidget } from './dashboard-widget-editor';

export default new ContainerModule(bind => {
    
    bindViewContribution(bind, DashboardWidgetEditorContribution);
    bind(DashboardWidgetEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: DashboardWidgetEditorWidget.ID,
        createWidget: () => {
            const child = ctx.container.createChild();
            const widget = child.get(DashboardWidgetEditorWidget);
            return widget;
        }
    }));


});
