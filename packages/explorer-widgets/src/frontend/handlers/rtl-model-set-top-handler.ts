import { injectable, inject } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { UriCommandHandler } from '@theia/core/lib/common/uri-command-handler';
import { ProjectManager } from '@gestola/project-manager';
import { hdlExtWtHeaders } from '@gestola/project-manager';

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
        let rtlModel = this.projManager.getCurrRTLModel();
        if(rtlModel) {
            return (rtlModel.designIncludedHDLFiles.find(e => uri.isEqual(e)) !== undefined && !rtlModel.topLevelModule?.uri.isEqual(uri) && rtlModel.rtlUri.isEqualOrParent(uri));
        } else {
            return false;
        }
    }
    
    execute(uri: URI){
        this.projManager.setTopModule(uri);
    }


}