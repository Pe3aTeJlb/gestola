import { ContainerModule } from 'inversify';
import { WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { OpenFpgaLoaderWidget } from './openfpgaloader-widget';
import { OpenFpgaLoaderContribution } from './openfpgaloader-contribution';
import "../../style/index.css";

export default new ContainerModule(bind => {

    //bind(OpenFpgaLoaderContribution).toSelf().inSingletonScope();
    bindViewContribution(bind, OpenFpgaLoaderContribution);

    bind(OpenFpgaLoaderWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: OpenFpgaLoaderWidget.ID,
        createWidget: () => {
            const child = ctx.container.createChild();
            const widget = child.get(OpenFpgaLoaderWidget);
            return widget;
        }
    }));
    
});