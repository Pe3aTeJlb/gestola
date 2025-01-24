import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";
import { Docker, Options } from 'docker-cli-js';


@injectable()
export class HelloWorldContainerStarter extends ES6Node {
    
    //private readonly RED: NodeAPI;
    //private readonly config: NodeDef;

    //constructor(node: Node, config: NodeDef, RED: NodeAPI){
    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        //RED.nodes.createNode(this, config);
        //this.config = config;
        //this.RED = RED;
        this.initialize();
    }

    initialize() {
        this.on("input", async (msg, send, done) => {

            const options = new Options (
                undefined, // uses local docker
                undefined, // uses current working directory
                true // echo command output to stdout/stderr
            );
              
            var docker = new Docker(options);

            var dt;
            await docker.command('run hello-world:latest --rm').then(function (data) {
                dt = data;
                console.log('data = ', data);
            })
            
            const newMsg = {
                ...msg,
                dt
            };
            send(newMsg);
            if (done) { done(); }
        });
    }

}