import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';

import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { hdlExtWtHeaders } from '@gestola/project-manager/lib/frontend/project-manager/rtl-model';

@injectable()
export class RTLModelSetTopModuleHandler implements UriCommandHandler<URI> {

    @inject(ProjectManager) 
    protected readonly projManager: ProjectManager;


    isVisible(uri: URI): boolean{
        if(!this.projManager.getCurrProject()) {
            return false;        
        } else {
            return hdlExtWtHeaders.includes(uri.path.ext);
        }
    }

    isEnabled(uri: URI): boolean {
        let sol = this.projManager.getCurrProject()?.getCurrRTLModel();
        if(sol) {
            return (sol.designIncludedHDLFiles.find(e => uri.isEqual(e)) !== undefined && !sol.topLevelModule?.uri.isEqual(uri) && sol.rtlUri.isEqualOrParent(uri));
        } else {
            return false;
        }
    }
    
    execute(uri: URI){
        this.projManager.setTopModule(uri);
    }


}