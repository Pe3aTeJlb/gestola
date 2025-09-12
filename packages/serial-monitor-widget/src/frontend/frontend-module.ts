import { ContainerModule } from '@theia/core/shared/inversify';
import { SerialMonitorWidget } from './serial-monitor-widget';
import { SerialMonitorWidgetContribution } from './serial-monitor-widget-contribution';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import "../../style/monitor.css";

export default new ContainerModule(bind => {
    
    bindViewContribution(bind, SerialMonitorWidgetContribution);
    bind(TabBarToolbarContribution).toService(SerialMonitorWidgetContribution);

    bind(SerialMonitorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: SerialMonitorWidget.ID,
        createWidget: () => container.get(SerialMonitorWidget),
    })).inSingletonScope();

});
