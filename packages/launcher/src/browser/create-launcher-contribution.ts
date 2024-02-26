import { ConfirmDialog, Dialog, FrontendApplication, FrontendApplicationContribution, StorageService } from '@theia/core/lib/browser';
import { ILogger, MaybePromise } from '@theia/core/lib/common';
import { nls } from '@theia/core/lib/common/nls';
import { inject, injectable } from '@theia/core/shared/inversify';
import { LauncherService } from './launcher-service';

@injectable()
export class CreateLauncherCommandContribution implements FrontendApplicationContribution {

    @inject(StorageService)
    protected readonly storageService: StorageService;

    @inject(ILogger)
    protected readonly logger: ILogger;

    @inject(LauncherService) private readonly launcherService: LauncherService;

    onStart(app: FrontendApplication): MaybePromise<void> {
        this.launcherService.isInitialized().then(async initialized => {
            if (!initialized) {
                const messageContainer = document.createElement('div');
                // eslint-disable-next-line max-len
                messageContainer.textContent = nls.localize("gestola/launcher/create-command-dialog","Would you like to install a shell command that launches the application?\nYou will be able to run Gestola from the command line by typing 'gestola'.");
                messageContainer.setAttribute('style', 'white-space: pre-line');
                const details = document.createElement('p');
                details.textContent = nls.localize("gestola/launcher/root-required", 'Administrator privileges are required, you will need to enter your password next.');
                messageContainer.appendChild(details);
                const dialog = new ConfirmDialog({
                    title: nls.localizeByDefault('Create launcher'),
                    msg: messageContainer,
                    ok: Dialog.YES,
                    cancel: Dialog.NO
                });
                const install = await dialog.open();
                this.launcherService.createLauncher(!!install);
                this.logger.info('Initialized application launcher.');
            } else {
                this.logger.info('Application launcher was already initialized.');
            }
        });
    }
}
