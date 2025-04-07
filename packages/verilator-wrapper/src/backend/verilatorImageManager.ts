import { inject, injectable } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { Server } from 'https';
import { Docker, Options } from 'docker-cli-js';
import * as path from 'path';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';

@injectable()
export class VerilatorImageManager implements BackendApplicationContribution {

    @inject(EnvVariablesServer)
    protected readonly envServer: EnvVariablesServer;
    
    public async onStart(server: Server): Promise<void> {

        const options = new Options (
            undefined, // uses local docker
            undefined, // uses current working directory
            true // echo command output to stdout/stderr
        );
          
        var docker = new Docker(options);

        let resp = await docker.command('images');
        let search = (resp.images).find((e: any) => e.repository.match('verilator'));

        if(search === undefined){
            let resPath: string = path.resolve(__dirname, '../../resources/verilator/verilator.tar');
            await docker.command(`load --input ${resPath}`);
        }
        
        
    }

}