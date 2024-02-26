import * as React from 'react';
import { AboutDialog, ABOUT_CONTENT_CLASS } from '@theia/core/lib/browser/about-dialog';
import { injectable, inject } from '@theia/core/shared/inversify';
import { renderDocumentation, renderDownloads, renderSourceCode, renderSupport, renderTickets, renderWhatIs, renderWhatIsNot } from './branding-util';
import { VSXEnvironment } from '@theia/vsx-registry/lib/common/vsx-environment';
import { CommandService } from '@theia/core';

@injectable()
export class TheiaBlueprintAboutDialog extends AboutDialog {

    @inject(VSXEnvironment)
    protected readonly environment: VSXEnvironment;

    @inject(CommandService)
    protected readonly commandService: CommandService;

    protected vscodeApiVersion: string;

    protected override async doInit(): Promise<void> {
        this.vscodeApiVersion = await this.environment.getVscodeApiVersion();
        super.doInit();
    }

    protected override render(): React.ReactNode {
        return <div className={ABOUT_CONTENT_CLASS}>
            {this.renderContent()}
        </div>;
    }

    protected renderContent(): React.ReactNode {
        return <div className='ad-container'>
            <div className='ad-float'>
                <div className='ad-logo'>
                </div>
                {this.renderExtensions()}
            </div>
            {this.renderTitle()}
            <hr className='gs-hr' />
            <div className='flex-grid'>
                <div className='col'>
                    {renderWhatIs(this.windowService, this.commandService)}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {renderWhatIsNot()}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {renderSupport(this.windowService)}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {renderTickets(this.windowService)}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {renderSourceCode(this.windowService)}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {renderDocumentation(this.windowService)}
                </div>
            </div>
            <div className='flex-grid'>
                <div className='col'>
                    {renderDownloads()}
                </div>
            </div>
        </div>;

    }

    protected renderTitle(): React.ReactNode {
        return <div className='gs-header'>
            <h1>CDT Cloud <span className='gs-blue-header'>Blueprint</span></h1>
            {this.renderVersion()}
        </div>;
    }

    protected renderVersion(): React.ReactNode {
        return <div>
            <p className='gs-sub-header' >
                {this.applicationInfo ? 'Version ' + this.applicationInfo.version + ' (Beta)' : '(Beta)'}
            </p>

            <p className='gs-sub-header' >
                {'VS Code API Version: ' + this.vscodeApiVersion}
            </p>
        </div>;
    }
}
