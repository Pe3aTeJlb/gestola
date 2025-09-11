import { ContainerModule } from '@theia/core/shared/inversify';
import {  FrontendApplicationContribution} from '@theia/core/lib/browser';
import { SerialMonitorWidget } from './serial-monitor-widget';
import { SerialMonitorWidgetContribution } from './serial-monitor-widget-contribution';
import { bindViewContribution, WidgetFactory } from '@theia/core/lib/browser';
import "../../style/monitor.css";

export default new ContainerModule(bind => {
    
    bindViewContribution(bind, SerialMonitorWidgetContribution);
    bind(FrontendApplicationContribution).toService(SerialMonitorWidgetContribution);

    bind(SerialMonitorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: SerialMonitorWidget.ID,
        createWidget: () => container.get(SerialMonitorWidget),
    })).inSingletonScope();

});
