import { URI } from "@theia/core";

export const NodeRedService = Symbol('NodeRedService');
export const NODE_RED_BACKEND_PATH = '/services/node-red';
export interface NodeRedService {
    launch(): Promise<void>;
    openFile(uri: URI): Promise<void>;
}