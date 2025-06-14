import { injectable, inject } from '@theia/core/shared/inversify';
import { ProjectManager } from "@gestola/project-manager/lib/frontend/project-manager/project-manager";
import { VerilatorBackendService } from '../common/protocol';

@injectable()
export class VerilatorFrontendService {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(VerilatorBackendService)
    private readonly verilatorBackendService: VerilatorBackendService;

    public runVerilator(){

        let sol = this.projManager.getCurrProject()?.getCurrRTLModel();
        if(sol && sol.topLevelModule){
            
            this.verilatorBackendService.runVerilator(
                sol.getRTLUri(),
                sol.topLevelModule.name,
                sol.collectDependencyHDLFiles()
            );
        }
       
    }

}