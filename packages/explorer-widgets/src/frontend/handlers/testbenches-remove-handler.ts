import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';

import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { hdlExt } from '@gestola/project-manager/lib/frontend/project-manager/rtl-model';

@injectable()
export class TestbenchesRemoveHandler implements UriCommandHandler<URI[]> {

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;


    isVisible(uris: URI[]): boolean{

        let check = true;

        if(!this.projManager.getCurrProject()) return false;
        
        if(uris.length < 1) return false;

        for (let uri of uris) {
            if(!hdlExt.includes(uri.path.ext)){check = false; break;}
        }

        return check;

    }

    isEnabled(uris: URI[]): boolean {

        let rtlModel = this.projManager.getCurrProject()?.getCurrRTLModel();
        if(!rtlModel) return false;
        if(uris.filter(e => rtlModel?.rtlUri.isEqualOrParent(e)).length < uris.length) return false;
        if(uris.filter(e => this.projManager.getCurrProject()?.getCurrRTLModel()?.designExcludedHDLFiles.find(i => i.isEqual(e)) !== undefined).length > 0){
            return false;
        }  
        if(uris.filter(e => this.projManager.getCurrProject()?.getCurrRTLModel()?.testbenchesFiles.find(i => i.uri.isEqual(e)) === undefined).length > 0) {
            return false;
        } else {
            return true;
        }

    }
    
    execute(uris: URI[]){
        this.projManager.removeTestBenchByUri(uris.filter(e => this.projManager.getCurrProject()?.getCurrRTLModel()?.testbenchesFiles.find(i => e.isEqual(i.uri)) !== undefined));
    }


}