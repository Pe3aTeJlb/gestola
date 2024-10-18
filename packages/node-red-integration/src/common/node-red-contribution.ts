import { Disposable } from '@theia/core';


export interface NodeRedContribution extends Disposable {
    readonly id: string;
}

export namespace NodeRedContribution {
    export const servicePath = '/services/node-red';
    export function getPath(contribution: NodeRedContribution): string {
        return servicePath + '/' + contribution.id;
    }
    export const Service = Symbol('NodeRedContributionService');
}