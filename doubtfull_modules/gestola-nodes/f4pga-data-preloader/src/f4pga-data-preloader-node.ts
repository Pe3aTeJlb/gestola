import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";

@injectable()
export class F4PGADataPreloader extends ES6Node {

    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        this.initialize();
    }

    initialize() {

        this.on("input", async (msg, send, done) => {

            const newMsg = {
                ...msg
            };
            send(newMsg);
            if (done) { done(); }
        });
        
    }

}