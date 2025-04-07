import { injectable } from '@theia/core/shared/inversify';
import { VerilatorBackendService } from '../common/protocol';
import { Docker, Options } from 'docker-cli-js';
import { URI } from '@theia/core';
import tmp = require('tmp');
import * as fs from 'fs';

@injectable()
export class VerilatorBackendServiceImpl implements VerilatorBackendService {
    
    async runVerilator(runPath: URI, topLevelModule: string, dependencies: URI[]): Promise<void> {
        
        const tempName = URI.fromFilePath(tmp.tmpNameSync({prefix: "verilator"})).path.name;
        const dependenciesDescription = tmp.fileSync({name:tempName, tmpdir: runPath?.path.fsPath()});
        
        fs.writeFileSync(dependenciesDescription.fd, dependencies.map(e => '`include ' + `"${runPath.relative(e)?.toString()}"`).join('\n'));

        const options = new Options (
            undefined, // uses local docker
            runPath.path.fsPath(), // uses current working directory
            true // echo command output to stdout/stderr
        );
          
        var docker = new Docker(options);

        await docker.command(`run --rm \
                        --mount type=bind,source='${runPath?.path.fsPath()}',target=/work \
                        --entrypoint /bin/bash \
                        verilator/verilator:latest \
                        -c \
                        "/usr/local/bin/verilator -Wno-fatal -CFLAGS -fcoroutines --cc --binary --trace --top ${topLevelModule} -y /work ${tempName} \
                        && /work/obj_dir/Vtb \
                        && chown -R $(id -u):$(id -g) /work"`
        ).then(function (data) {
            console.log('data = ', data);
        })

        dependenciesDescription.removeCallback();
     
        return Promise.resolve();

    }

}