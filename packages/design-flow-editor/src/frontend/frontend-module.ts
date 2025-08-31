import { ContainerModule } from '@theia/core/shared/inversify';
import { WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { DesignFlowEditorWidget } from './design-flow-editor-widget';
import { DesignFlowEditorContribution } from './design-flow-editor-contribution';
import { DesignFLowEditorWidgetOptions } from './types';

export default new ContainerModule(bind => {

    bindViewContribution(bind, DesignFlowEditorContribution);

    bind(DesignFlowEditorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: DesignFlowEditorWidget.ID,
        createWidget: (options: DesignFLowEditorWidgetOptions) => {
            const child = ctx.container.createChild();
            const widget = child.get(DesignFlowEditorWidget);
            return widget;
        }
    }));

});
