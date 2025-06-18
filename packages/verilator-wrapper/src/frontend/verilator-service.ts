import { injectable, inject } from '@theia/core/shared/inversify';
import { ProjectManager } from "@gestola/project-manager/lib/frontend/project-manager/project-manager";
import { VerilatorBackendService } from '../common/protocol';
import { HDLModuleRef } from '@gestola/project-manager/src/frontend/project-manager/rtl-model';
import moment = require('moment');

@injectable()
export class VerilatorFrontendService {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(VerilatorBackendService)
    private readonly verilatorBackendService: VerilatorBackendService;

    public async runMultiple(testbenchs: HDLModuleRef[]){
        for(let testbench of testbenchs){
            this.runVerilator(testbench);
        }
    }

    public async runVerilator(testbench: HDLModuleRef){

        let rtlModel = this.projManager.getCurrProject()?.getCurrRTLModel();
        if(rtlModel && rtlModel.topLevelModule){

            let fileService = this.projManager.getFileSerivce();
            
            if(!fileService.exists(rtlModel.simResultsUri)){
                await fileService.createFolder(rtlModel.simResultsUri);
            }

            let resultFolderName = `${testbench.name} ${moment().format('YYYY-MM-DD HH:mm:ss')}`;
            let resultUri = rtlModel.simResultsUri.resolve(resultFolderName);
            await fileService.createFolder(resultUri);

            let tempDataUri = resultUri.resolve("data");
            await fileService.createFolder(tempDataUri);

            this.verilatorBackendService.runVerilator(
                rtlModel.getRTLUri(),
                resultUri,
                testbench.name,
                rtlModel.collectSimSetFor(testbench),
                true
            );
        }
       
    }

}