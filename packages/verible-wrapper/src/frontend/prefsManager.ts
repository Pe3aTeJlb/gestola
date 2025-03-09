import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplicationContribution } from '@theia/core/lib/browser';
import { PreferenceService  } from '@theia/core/lib/browser/preferences/preference-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import URI from '@theia/core/lib/common/uri';
import * as path from 'path';

@injectable()
export class VeriblePrefsManager implements FrontendApplicationContribution {

    @inject(PreferenceService)
    protected readonly prefsService: PreferenceService;

    @inject(FrontendApplicationStateService)
    private readonly stateService: FrontendApplicationStateService;

    @inject(EnvVariablesServer)
    protected readonly envServer: EnvVariablesServer;

    async onStart(): Promise<void> {
        this.stateService.reachedState('ready').then(
            async () => {
                let configDirUri = new URI(await this.envServer.getConfigDirUri()).path.fsPath();
                let veriblePath = path.join(configDirUri, 'verible', 'verible-verilog-ls');
                let filelistPath = path.join(configDirUri, 'verible.filelist');
                this.prefsService.updateValue("verible.path", veriblePath);
                this.prefsService.updateValue("verible.arguments", [`--file_list_path=${filelistPath}`]);
            }
        );
    }

    public setFilelistPath(filelistPath: string){
        this.prefsService.updateValue("verible.arguments", [`--file_list_path=${filelistPath}`]);
    }

}