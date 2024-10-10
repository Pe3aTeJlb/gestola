/********************************************************************************
 * Copyright (c) 2022 EclipseSource and others.
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
import 'reflect-metadata';

import { createAppModule, createSocketCliParser, Logger, ServerModule, SocketServerLauncher } from '@eclipse-glsp/server/node';
import { Container } from 'inversify';
import { TaskListDiagramModule } from './diagram/tasklist-diagram-module';
import { configureELKLayoutModule } from '@eclipse-glsp/layout-elk';
import { DesignFlowLayoutConfigurator } from './layout/design-flow-layout-configurator';

export async function launch(argv?: string[]): Promise<void> {
    const options = createSocketCliParser().parse(argv);
    const appContainer = new Container();
    appContainer.load(createAppModule(options));

    const logger = appContainer.get(Logger);

    // Add fallback hooks to catch unhandled exceptions & promise rejections and prevent the node process from crashing
    process.on('unhandledRejection', (reason, p) => {
        logger.error('Unhandled Rejection:', p, reason);
    });

    process.on('uncaughtException', error => {
        logger.error('Uncaught exception:', error);
    });

    const launcher = appContainer.resolve(SocketServerLauncher);
    const elkLayoutModule = configureELKLayoutModule({ algorithms: ['layered'], layoutConfigurator: DesignFlowLayoutConfigurator });
    const serverModule = new ServerModule().configureDiagramModule(new TaskListDiagramModule(), elkLayoutModule);

    launcher.configure(serverModule);
    launcher.start({ port: options.port, host: options.host });
}

launch(process.argv).catch(error => console.error('Error in tasklist server launcher:', error));
