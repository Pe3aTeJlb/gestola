import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import { ApplicationServer } from "@theia/core/lib/common/application-protocol";

import ES6Node from "@gestola/df-base-node";
import getDecorators from "inversify-inject-decorators";

//const path = require('path');
const { container } = require("@gestola/electron-app/src-gen/backend/server");
let { lazyInject } = getDecorators(container);

//console.log('lol what', path.resolve(__dirname, '../../../../electron-app/src-gen/backend/server.js'));
//console.log('lol what', __dirname);
//console.log("kek lol", container);

@injectable()
export class GestolaVersionNode extends ES6Node {

    @lazyInject(ApplicationServer)
    protected readonly appServer: ApplicationServer;

   // private readonly RED: NodeAPI;
   // private readonly config: NodeDef;

    //constructor(node: Node, config: NodeDef, RED: NodeAPI){
    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        //RED.nodes.createNode(this, config);
       // this.config = config;
       // this.RED = RED;
        //console.log("getting appserver via inject", this.appServer);
        this.initialize();
    }

    initialize() {
        this.on("input", async (msg, send, done) => {
            //console.log("try to send msg", (await this.appServer.getApplicationInfo())?.version);
            const newMsg = {
                ...msg,
                version: (await this.appServer.getApplicationInfo())?.version
            };
            send(newMsg);
            if (done) { done(); }
        });
    }

    kek(){
        //console.log("DI KEK", this.appServer);
    }

}