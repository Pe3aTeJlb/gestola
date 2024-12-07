
import {  injectable } from '@theia/core/shared/inversify';
import { BaseGLSPClientContribution } from './client/glsp-client-contribution';
import { MaybePromise } from '../utils/type-util';
import { Args } from '../common/types';



@injectable()
export class NodeRedGLSPClientContribution extends BaseGLSPClientContribution {

    readonly id = 'keklol';

    protected override createInitializeOptions(): MaybePromise<Args | undefined> {
        return {
            ['timestamp']: new Date().toString(),
            ['message']: 'Custom Options Available'
        };
    }

}
