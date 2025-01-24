import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";
import { Docker, Options } from 'docker-cli-js';

@injectable()
export class F4PGAContainer extends ES6Node {
    
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
            var docker_version;
            var container_log;

            await docker.command("--version").then(function (data) {
                console.log('data = ', data);
                docker_version = data;
            });
            /*
                                run  -it \
                                --name kekv \
                                --mount type=bind,source=/home/debian/ECAD/test/rtl,target=/shared \
                                --mount type=bind,source=/home/debian/ECAD/test/fpga,target=/output \
                                --env ECAD_USER=$(id -u ${USER}):$(id -g ${USER}) \
                                --entrypoint /bin/bash \
                                test:latest
            */
            await docker.command(`run --rm \
                                --name kekv \
                                --mount type=bind,source=/home/debian/ECAD/test/rtl,target=/shared \
                                --mount type=bind,source=/home/debian/ECAD/test/fpga,target=/output \
                                --env ECAD_USER=$(id -u $\{USER\}):$(id -g $\{USER\}) \
                                test:latest`
                                ).then(function (data) {
                console.log('data = ', data);
                container_log = data;
            });
            
            const newMsg = {
                ...msg,
                docker_version,
                container_log
            };
            send(newMsg);
            if (done) { done(); }
        });
    }

}