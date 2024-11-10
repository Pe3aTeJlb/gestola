/********************************************************************************
 * Copyright (c) 2022-2023 STMicroelectronics and others.
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
import { Disposable, DisposableCollection } from '../../common/disposable';
import { MaybePromise } from '../../common/type-util'
import { Container, ContainerModule, injectable } from 'inversify';

@injectable()
export abstract class NodeRedServerLauncher<T> implements Disposable {

    protected _modules: ContainerModule[] = [];
    protected running: boolean;
    protected toDispose = new DisposableCollection();

    createContainer(...additionalModules: ContainerModule[]): Container {
        const container = new Container();
        container.load(...this._modules, ...additionalModules);
        return container;
    }

    start(startParams: T): MaybePromise<void> {
        if (!this.running) {
            this.running = true;
            return this.run(startParams);
        }
    }

    protected abstract run(startParams: T): MaybePromise<void>;

    shutdown(): MaybePromise<void> {
        if (this.running) {
            const result = this.stop();
            this.running = false;
            return result;
        }
    }

    protected stop(): MaybePromise<void> {
        this.dispose();
    }

    dispose(): void {
        this.toDispose.dispose();
    }

    get modules(): ContainerModule[] {
        if (!this._modules) {
            throw new Error('The GLSPServerLauncher has not been configured yet');
        }
        return this._modules;
    }
}
