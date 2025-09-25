import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { ProjectManager } from '@gestola/project-manager';
import { hdlExt } from '@gestola/project-manager';

@injectable()
export class TestbenchesAddHandler implements UriCommandHandler<URI> {

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;


    isVisible(uri: URI): boolean{

        let check = true;

        if(!this.projManager.getCurrProject()) return false;
        
        if(!hdlExt.includes(uri.path.ext)){
            check = false;
        }

        return check;

    }

    isEnabled(uri: URI): boolean {

        let rtlModel = this.projManager.getCurrRTLModel();

        if(!rtlModel) return false;
        if(!rtlModel?.rtlUri.isEqualOrParent(uri)) return false;
        if(this.projManager.getCurrRTLModel()?.designExcludedHDLFiles.find(i => i.isEqual(uri)) !== undefined){
            return false;
        }  
        if(this.projManager.getCurrRTLModel()?.testbenchesFiles.find(i => i.uri.isEqual(uri)) !== undefined) {
            return false;
        } else {
            return true;
        }

    }
    
    execute(uri: URI){
        this.projManager.addTestBenchByUri(uri);
    }


}