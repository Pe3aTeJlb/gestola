/********************************************************************************
 * Copyright (c) 2019-2024 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * http://www.eclipse.org/legal/epl-2.0.
 *
 * This Source Code may also be made available under the following Secondary
 * Licenses when the conditions for such availability set forth in the Eclipse
 * Public License v. 2.0 are satisfied: GNU General Public License, version 2
 * with the GNU Classpath Exception which is available at
 * https://www.gnu.org/software/classpath/license.html.
 *
 * SPDX-License-Identifier: EPL-2.0 OR GPL-2.0 WITH Classpath-exception-2.0
 ********************************************************************************/
import { ConnectionHandler } from '@theia/core/lib/common';
import { ContainerModule } from '@theia/core/shared/inversify';
import { VERILATOR_BACKEND_PATH, VerilatorBackendService } from '../common/protocol';
import { JsonRpcConnectionHandler } from '@theia/core/lib/common/messaging';
import { VerilatorBackendServiceImpl } from './verilator-backend-service';
import { VerilatorImageManager } from './verilatorImageManager';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';

export default new ContainerModule(bind => {

    bind(VerilatorImageManager).toSelf().inSingletonScope();
    bind(BackendApplicationContribution).toService(VerilatorImageManager);

    bind(VerilatorBackendServiceImpl).toSelf().inSingletonScope();
    bind(VerilatorBackendService).to(VerilatorBackendServiceImpl).inSingletonScope()
    bind(ConnectionHandler).toDynamicValue(ctx =>
        new JsonRpcConnectionHandler(VERILATOR_BACKEND_PATH, () => {
            return ctx.container.get<VerilatorBackendService>(VerilatorBackendService);
        })
    ).inSingletonScope();

});