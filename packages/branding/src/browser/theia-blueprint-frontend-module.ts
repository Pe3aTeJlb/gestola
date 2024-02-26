import '../../src/browser/style/index.css';

import { WidgetFactory } from '@theia/core/lib/browser';
import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import { GettingStartedWidget } from '@theia/getting-started/lib/browser/getting-started-widget';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { TheiaBlueprintAboutDialog } from './theia-blueprint-about-dialog';
import { GestolaContribution } from './theia-blueprint-contribution';
import { TheiaBlueprintGettingStartedWidget } from './theia-blueprint-getting-started-widget';

export default new ContainerModule((bind, _unbind, isBound, rebind) => {
    bind(TheiaBlueprintGettingStartedWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(context => ({
        id: GettingStartedWidget.ID,
        createWidget: () => context.container.get<TheiaBlueprintGettingStartedWidget>(TheiaBlueprintGettingStartedWidget),
    })).inSingletonScope();
    if (isBound(AboutDialog)) {
        rebind(AboutDialog).to(TheiaBlueprintAboutDialog).inSingletonScope();
    } else {
        bind(AboutDialog).to(TheiaBlueprintAboutDialog).inSingletonScope();
    }

    bind(GestolaContribution).toSelf().inSingletonScope();
    [CommandContribution, MenuContribution].forEach(serviceIdentifier =>
        bind(serviceIdentifier).toService(GestolaContribution)
    );
});
