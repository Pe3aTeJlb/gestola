import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';

@injectable()
export class GestolaExplorerContextKeyService {

    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    protected _explorerViewletVisible: ContextKey<boolean>;
    get explorerViewletVisible(): ContextKey<boolean> {
        return this._explorerViewletVisible;
    }

    protected _explorerViewletFocus: ContextKey<boolean>;
    /** True if Explorer view has keyboard focus. */
    get explorerViewletFocus(): ContextKey<boolean> {
        return this._explorerViewletFocus;
    }

    protected _filesNavigatorFocus: ContextKey<boolean>;
    /** True if File Explorer section has keyboard focus. */
    get filesNavigatorFocus(): ContextKey<boolean> {
        return this._filesNavigatorFocus;
    }

    protected _fileNavigatorResourceIsFolder: ContextKey<boolean>;
    get fileNavigatorResourceIsFolder(): ContextKey<boolean> {
        return this._fileNavigatorResourceIsFolder;
    }

    protected _fileNavigatorId: ContextKey<string>;
    get fileNavigatorId(): ContextKey<string> {
        return this._fileNavigatorId;
    }

    @postConstruct()
    protected init(): void {
        this._explorerViewletVisible = this.contextKeyService.createKey<boolean>('gestolaExplorerViewletVisible', false);
        this._explorerViewletFocus = this.contextKeyService.createKey<boolean>('gestolaExplorerViewletFocus', false);
        this._filesNavigatorFocus = this.contextKeyService.createKey<boolean>('gestolaFileNavigatorFocus', false);
        this._fileNavigatorResourceIsFolder = this.contextKeyService.createKey<boolean>('gestolaFileNavigatorResourceIsFolder', false);
        this._fileNavigatorId = this.contextKeyService.createKey<string>('gestolaFileNavigatorId', "");
    }

}