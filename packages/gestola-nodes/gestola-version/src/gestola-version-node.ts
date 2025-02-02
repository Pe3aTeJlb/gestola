import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";
import { getSymbol, diContainer } from "@gestola/df-base-node";

import getDecorators from "inversify-inject-decorators";
let { lazyInject } = getDecorators(diContainer);

import { ApplicationServer } from "@theia/core/lib/common/application-protocol";
const ApplicationServerSymbol = getSymbol("@theia/core/lib/common/application-protocol", 'ApplicationServer');

@injectable()
export class GestolaVersionNode extends ES6Node {

    @lazyInject(ApplicationServerSymbol)
    protected readonly appServer: ApplicationServer;

    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        this.initialize();
    }

    initialize() {
        this.on("input", async (msg, send, done) => {
            let appVersion = (await this.appServer.getApplicationInfo())?.version;
            console.log("try to send msg", appVersion);
            const newMsg = {
                ...msg,
                version: appVersion
            };
            send(newMsg);
            if (done) { done(); }
        });
    }


}