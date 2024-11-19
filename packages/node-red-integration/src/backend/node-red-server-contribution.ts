/********************************************************************************
 * Copyright (c) 2019-2023 EclipseSource and others.
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
import {
    getPort,
    GLSPSocketServerContribution,
    GLSPSocketServerContributionOptions
} from './process-spawner/glsp-socket-server-contribution';
import { injectable } from '@theia/core/shared/inversify';

const path = require('path');
const DEFAULT_PORT = 1881;
const PORT_ARG_KEY = 'NODERED';
//const MODULE_PATH = require.resolve('@gestola/node-red-integration');
const MODULE_PATH = path.resolve(__dirname, '../../resources/node-red/node-red-integration.js');

@injectable()
export class NodeRedServerContribution extends GLSPSocketServerContribution {
    readonly id = 'keklol';

    createContributionOptions(): Partial<GLSPSocketServerContributionOptions> {
        return {
            executable: MODULE_PATH,
            socketConnectionOptions: { port: getPort(PORT_ARG_KEY, DEFAULT_PORT) },
        };
    }
    
}
