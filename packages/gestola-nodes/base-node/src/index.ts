import path = require('path');
import { Node, NodeContext, NodeMessage, NodeMessageInFlow, NodeStatus } from "node-red";
import { EditorRED } from "node-red"
const { __webpack_require__ } = require("@gestola/electron-app/lib/backend/main");
const { container } = require("@gestola/electron-app/lib/backend/main");
/*
 * This is a hack on TypeScript that lets us "extend" a node object so that we
 * can use ES6 classes with all the proper type hinting instead of constructor
 * functions. Object.assign(this, node) acts as a poor-man's "inherit", and so we
 * can @ts-ignore all the warnings about missing implementations/assignment in the
 * constructor.
 */
export const diContainer = container;

export function getSymbol(file:string, name:string): SymbolConstructor {
    let resolved = require.resolve(file);
    let buff;
    if (resolved.includes('packages')) {
        buff = path.join('..', 'packages', resolved.split('packages')[1]);
        console.log(buff);
        let kek: SymbolConstructor = __webpack_require__.c[buff].exports[name];
        console.log('qqq', kek, container.isBound(kek));
        return kek;
    }
    else if (resolved.includes('node_modules')) {
        buff = path.join('..', 'node_modules', resolved.split('node_modules')[1]);
        console.log(buff);
        let kek: SymbolConstructor = __webpack_require__.c[buff].exports[name];
        console.log('qqq', kek, container.isBound(kek));
        return kek;
    }
    else {
        throw "___Cannot resolve___";
    }
}


// The type of a "config" passed to RED.nodes.registerType in the browser
export type EditorConfig = Parameters<EditorRED["nodes"]["registerType"]>[1];

export default class ES6Node implements Node {
    // @ts-ignore
    id: string 
    // @ts-ignore
    type: string;
    // @ts-ignore
    z: string;
    // @ts-ignore
    name?: string | undefined;
    // @ts-ignore
    credentials: object;
    // @ts-ignore
    updateWires(wires: Array<[]>): void;
    // @ts-ignore
    context(): NodeContext;
    // @ts-ignore
    close(removed: boolean): Promise<void>;
    // @ts-ignore
    send(msg?: NodeMessage | Array<NodeMessage | NodeMessage[] | null>): void;
    // @ts-ignore
    receive(msg?: NodeMessage): void;
    // @ts-ignore
    log(msg: any): void;
    // @ts-ignore
    warn(msg: any): void;
    // @ts-ignore
    error(logMessage: any, msg?: NodeMessage): void;
    // @ts-ignore
    debug(msg: any): void;
    // @ts-ignore
    trace(msg: any): void;
    // @ts-ignore
    metric(): boolean;
    // @ts-ignore
    metric(eventname: string, msg: NodeMessage, metricValue: number): void;
    // @ts-ignore
    status(status: string | NodeStatus): void;
    on(
        event: 'input',
        listener: (
            msg: NodeMessageInFlow,
            send: (msg: NodeMessage | Array<NodeMessage | NodeMessage[] | null>) => void,
            done: (err?: Error) => void,
        ) => void,
    ): this;
    on(event: 'close', listener: () => void): this;
    on(event: 'close', listener: (done: () => void) => void): this; // tslint:disable-line:unified-signatures
    // @ts-ignore
    on(event: 'close', listener: (removed: boolean, done: () => void) => void): this; // tslint:disable-line:unified-signatures


    /* EVENT EMITTER */
    // @ts-ignore
    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore
    once(eventName: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore
    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore
    off(eventName: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore
    prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore
    removeAllListeners(event?: string | symbol): this;
    // @ts-ignore
    setMaxListeners(n: number): this;
    // @ts-ignore
    getMaxListeners(): number;
    // @ts-ignore
    listeners(eventName: string | symbol): Function[];
    // @ts-ignore
    rawListeners(eventName: string | symbol): Function[];
    // @ts-ignore
    emit(eventName: string | symbol, ...args: any[]): boolean;
    // @ts-ignore
    listenerCount(eventName: string | symbol): number;
    // @ts-ignore
    prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this;
    // @ts-ignore
    eventNames(): Array<string | symbol>;
    
    constructor(node: Node) {
        Object.assign(this, node);

        if ("super_" in node.constructor) {
            // Don't call this if we're e.g. in a test environment
            const super_: Function = (node.constructor as any)["super_"];
            super_.bind(this)(node);
        }
    }
    
};
