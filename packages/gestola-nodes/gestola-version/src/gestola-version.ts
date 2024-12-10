import { inject } from 'inversify';
import { ApplicationServer } from "@theia/core/lib/common/application-protocol";
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";
import { ProjectManagerBackendService } from "@gestola/project-manager"
const util = require("node:util");

export class GestolaVersionNode extends ES6Node {

    @inject(ApplicationServer)
    protected readonly appServer: ApplicationServer;

    @inject(ProjectManagerBackendService)
    private readonly projManagerBackendService: ProjectManagerBackendService;


   // private readonly RED: NodeAPI;
   // private readonly config: NodeDef;

    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
       // this.config = config;
       // this.RED = RED;
        console.log("getting appserver via inject", this.appServer);
        console.log("getting manager via inject", this.projManagerBackendService);
        this.initialize();
    }

    initialize() {
        this.on("input", async (msg, send, done) => {
            console.log("try to send msg");
            const newMsg = {
                ...msg,
                version: (await this.appServer.getApplicationInfo())?.version
            };
            send(newMsg);
            if (done) { done(); }
        });
    }

}

module.exports = function(RED: NodeAPI) {
    function MakeNode(this: Node, config: NodeDef) {
        RED.nodes.createNode(this, config);
        util.inherits(GestolaVersionNode, this.constructor);
        return new GestolaVersionNode(this, config, RED);
    }
    RED.nodes.registerType("gestola-version", MakeNode);
};

export default module.exports;
module.exports.LowerCaseNode = GestolaVersionNode;