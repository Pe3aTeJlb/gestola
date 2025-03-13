import { inject, injectable } from '@theia/core/shared/inversify';
import { BackendApplicationContribution } from '@theia/core/lib/node/backend-application';
import { Server } from 'https';
import * as os from 'os';
import * as fs from 'fs';

import * as path from 'path';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';

@injectable()
export class VeribleBinManager implements BackendApplicationContribution {

    @inject(EnvVariablesServer)
    protected readonly envServer: EnvVariablesServer;
    
    public async onStart(server: Server): Promise<void> {
        
        let resPath: string = '';

        if(os.platform().toString() === 'win32'){
            if(os.arch().toString() === 'x64'){
                resPath = path.resolve(__dirname, '../../resources/verible/windows/x64');
            }
        } else if (os.platform().toString() === 'linux'){
            if(os.arch().toString() === 'x64' || os.arch().toString() === 'ia32'){
                resPath = path.resolve(__dirname, '../../resources/verible/linux/x64');
            }
        }


        let veriblePath = path.join(new URI(await this.envServer.getConfigDirUri()).path.fsPath(), 'verible');
       
        if(!fs.existsSync(veriblePath)){
            fs.mkdir(veriblePath, (error) => {console.log(error)});
            fs.readdir(resPath, (err, files) => {
                files.forEach(file => {
                  fs.copyFile(path.join(resPath, file), path.join(veriblePath, file), (error) => {console.log(error)});
                });
              });
        }
        
    }

}