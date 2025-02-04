import { injectable } from '@theia/core/shared/inversify';
import { NodeDef, NodeAPI, Node } from "@node-red/registry";
import ES6Node from "@gestola/df-base-node";
import { Docker, Options } from 'docker-cli-js';
import tmp = require('tmp');
//import dockerNames from 'docker-names-ts';

@injectable()
export class F4PGADockerContainer extends ES6Node {
    
    constructor(node: Node, config: NodeDef, RED: NodeAPI){
        super(node);
        this.initialize();
    }

    initialize() {

        this.on("input", async (msg:any, send, done) => {

            //this.start(msg.paths);

            const newMsg = {
                ...msg
            };
            send(newMsg);
            if (done) { done(); }
        });

    }

    start(paths: string[]){
    
        tmp.dir(async function _tempDirCreated(err, path, cleanupCallback) {
            if (err) { cleanupCallback(); throw err;}
          
            console.log('TMP Dir: ', path);

            //uris.forEach(i => fs.copy(i.path.fsPath(), path, {errorOnExist: true}));
            
            const options = new Options (
                undefined, // uses local docker
                undefined, // uses current working directory
                true // echo command output to stdout/stderr
            );
              
            var docker = new Docker(options);
    
            await docker.command("--version").then(function (data) {
                console.log('data = ', data);
            });
        /*
            await docker.command(`run --rm \
                                --name ${dockerNames.getRandomName(5)} \
                                --mount type=bind,source=${paths[0]},target=/shared \
                                --mount type=bind,source=${paths[1]},target=/output \
                                --env ECAD_USER=$(id -u $\{USER\}):$(id -g $\{USER\}) \
                                test:latest`
                                ).then(function (data) {
                console.log('data = ', data);
            });*/
    
            cleanupCallback();
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


    }

}