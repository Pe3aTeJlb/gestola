/********************************************************************************
 * Copyright (c) 2022-2023 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied:
 * -- GNU General Public License, version 2 with the GNU Classpath Exception
 * which is available at https://www.gnu.org/software/classpath/license.html
 * -- MIT License which is available at https://opensource.org/license/mit.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0 OR MIT
 ********************************************************************************/
import {
    bindAsService,
    bindOrRebind,
    configureActionHandler,
    configureDefaultModelElements,
    configureModelElement,
    ConsoleLogger,
    ContainerConfiguration,
    debugModule,
    DefaultTypes,
    editLabelFeature,
    EnableDefaultToolsAction,
    GLabel,
    GLabelView,
    gridModule,
    helperLineModule,
    initializeDiagramContainer,
    LogLevel,
    SetModelAction,
    TYPES,
    UpdateModelAction
} from '@eclipse-glsp/client';
import 'balloon-css/balloon.min.css';
import { Container, ContainerModule } from 'inversify';
import '../css/diagram.css';
import { DesignFlowGridSnapper } from './grid-snapper';
import { DesignFlowStartup } from './design-flow-startup';
import { ExtendedToolPalette } from './extended-tool-palette';

const DesignFlowDiagramModule = new ContainerModule((bind, unbind, isBound, rebind) => {

    rebind(TYPES.ILogger).to(ConsoleLogger).inSingletonScope();
    rebind(TYPES.LogLevel).toConstantValue(LogLevel.warn);
    const context = { bind, unbind, isBound, rebind };
    configureDefaultModelElements(context);
    configureModelElement(context, DefaultTypes.LABEL, GLabel, GLabelView, { enable: [editLabelFeature] });
    
    bindAsService(context, TYPES.IDiagramStartup, DesignFlowStartup);
    bindOrRebind(context, TYPES.ISnapper).to(DesignFlowGridSnapper);
    
    bindAsService(bind, TYPES.IUIExtension, ExtendedToolPalette);
    rebind(TYPES.IDiagramStartup).toService(ExtendedToolPalette);
    configureActionHandler({ bind, isBound }, EnableDefaultToolsAction.KIND, ExtendedToolPalette);
    configureActionHandler({ bind, isBound }, UpdateModelAction.KIND, ExtendedToolPalette);
    configureActionHandler({ bind, isBound }, SetModelAction.KIND, ExtendedToolPalette);
    
});

export function initializeDesignFlowDiagramContainer(container: Container, ...containerConfiguration: ContainerConfiguration): Container {
    return initializeDiagramContainer(
        container,
        helperLineModule,
        gridModule,
        debugModule,
        DesignFlowDiagramModule, 
        ...containerConfiguration);
}