import { injectable } from '@theia/core/shared/inversify';
import { VivadoBackendService } from '../common/protocol';
import tmp = require('tmp');
import { URI } from '@theia/core';
import * as fs from 'fs';
import * as proc from "child_process";

@injectable()
export class VivadoBackendServiceImpl implements VivadoBackendService {
    
    async runVivado(runData: string[], runPath: URI): Promise<void> {
      
      const tempFolderName = URI.fromFilePath(tmp.tmpNameSync({prefix: "vivado"})).path.name;
      const tempFolder = tmp.dirSync({name:tempFolderName, tmpdir: runPath.path.fsPath()});

      const tempRunFileName = URI.fromFilePath(tmp.tmpNameSync({prefix: "vivado"})).path.name;
      const runFile = tmp.fileSync({name:tempRunFileName, tmpdir: tempFolder.name});

      fs.writeFileSync(runFile.fd, runData.join('\n'));

      console.log("kekl", runFile);
      let p = proc.spawn(`/tools/Xilinx/Vivado/2023.2/bin/vivado -mode tcl -source ${runFile.name}`, [], { shell: true, stdio: 'inherit' });

      p.on('exit', (code) => {
        runFile.removeCallback();
        tempFolder.removeCallback();
      });


    }

}