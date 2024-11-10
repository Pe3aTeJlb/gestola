import { Disposable } from '@theia/core';


export interface NodeRedContribution extends Disposable {
    openFile(): Promise<void>;
}

export namespace NodeRedContribution {
    export const servicePath = '/services/node-red-integration';
    export const Service = Symbol('NodeRedContribution');
}