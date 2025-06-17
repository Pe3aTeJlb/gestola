import { injectable } from '@theia/core/shared/inversify';
import { VerilatorBackendService } from '../common/protocol';
import { Docker, Options } from 'docker-cli-js';
import { URI } from '@theia/core';
import tmp = require('tmp');
import * as fs from 'fs';

@injectable()
export class VerilatorBackendServiceImpl implements VerilatorBackendService {
    
    async runVerilator(rtlModelUri: URI, resultUri: URI, topLevelModule: string, dependencies: URI[], saveTemp: boolean): Promise<void> {
        
        const tempName = URI.fromFilePath(tmp.tmpNameSync({prefix: "verilator"})).path.name;
        const dependenciesDescription = tmp.fileSync({name:tempName, tmpdir: rtlModelUri?.path.fsPath()});
        
        fs.writeFileSync(dependenciesDescription.fd, dependencies.map(e => '`include ' + `"${rtlModelUri.relative(e)?.toString()}"`).join('\n'));

        const options = new Options (
            undefined, // uses local docker
            rtlModelUri.path.fsPath(), // uses current working directory
            true // echo command output to stdout/stderr
        );
          
        var docker = new Docker(options);

        if(saveTemp){

            await docker.command(`run --rm \
                                --mount type=bind,source='${rtlModelUri.path.fsPath()}',target=/data \
                                --mount type=bind,source='${resultUri.path.fsPath()}',target=/work \
                                --entrypoint /bin/bash \
                                verilator/verilator:latest \
                                -c \
                                "/usr/local/bin/verilator -Wno-fatal -CFLAGS -fcoroutines -o runner  \
                                --cc --binary --trace --top ${topLevelModule} -y /data ${tempName} --Mdir /work/data \
                                && /work/data/runner \
                                && chown -R $(id -u):$(id -g) /work"`
            ).then(function (data) {
                console.log('data = ', data);
            });

        } else {

            await docker.command(`run --rm \
                            --mount type=bind,source='${rtlModelUri.path.fsPath()}',target=/data \
                            --mount type=bind,source='${resultUri.path.fsPath()}',target=/work \
                            --entrypoint /bin/bash \
                            verilator/verilator:latest \
                            -c \
                            "/usr/local/bin/verilator -Wno-fatal -CFLAGS -fcoroutines -o runner  \
                            --cc --binary --trace --top ${topLevelModule} -y /data ${tempName} --Mdir /result \
                            && /result/runner \
                            && chown -R $(id -u):$(id -g) /work"`
            ).then(function (data) {
                console.log('data = ', data);
            });

        }

        /*
        docker run -it --rm 
        --mount type=bind,source='/home/debian/ECAD/test verilator/solution_1/rtl',target=/data 
        --mount type=bind,source='/home/debian/ECAD/test verilator/solution_1/rtl/simresults',target=/work 
        --entrypoint bash verilator/verilator:latest
        verilator -Wno-fatal -CFLAGS -fcoroutines --cc --binary --trace -o runner --top tb -y /data lol.sv --Mdir /work
        */

        dependenciesDescription.removeCallback();
     
        return Promise.resolve();

    }

}