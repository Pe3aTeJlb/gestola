import { injectable, inject } from '@theia/core/shared/inversify';
import { WorkspaceService } from "@theia/workspace/lib/browser/workspace-service";
import { MessageService, QuickInputService, QuickPickService, QuickPickValue, nls } from '@theia/core/lib/common';
import { OpenFileDialogProps, FileDialogService } from '@theia/filesystem/lib/browser';
import { Event, Emitter, URI } from "@theia/core";
import { FileStat } from '@theia/filesystem/lib/common/files';
import  { Project }  from './project/project';
import { ConfirmDialog, Dialog, FrontendApplication, FrontendApplicationContribution, OnWillStopAction } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { DatabaseBackendService, ProjectManagerBackendService, ProjectTemplate, LLDTemplate } from '../common/protocol';
import { LowLevelDesign } from './project/low-level-design';
import { HDLModuleRef, RTLModel } from './project/rtl-model';
import { FPGATopologyModel } from './project/fpga-topology-model';

export interface ProjectChangeEvent {
    readonly proj: Project;
}

export interface ProjectsListChangeEvent {
    readonly projects: Project[];
}

export interface LLDChangeEvent {
    readonly lld: LowLevelDesign;
}

export interface LLDListChangeEvent {
    readonly lld: LowLevelDesign[];
}

export interface ProjectFavoriteStatusChangeEvent {
    readonly project: Project;
}

export interface DesignFilesIncludeEvent {
    readonly uris: URI[];
}

export interface DesignFilesExcludeEvent {
    readonly uris: URI[];
}

export interface DesignTopModuleChangeEvent {
    readonly module: HDLModuleRef | undefined;
}

export interface TestBenchesAddEvent {
    readonly module: HDLModuleRef;
}

export interface TestBenchesRemoveEvent {
    readonly modules: HDLModuleRef[];
}

export interface FPGATopologyModelChangeEvent {
    readonly model: FPGATopologyModel | undefined;
}

export interface FPGATopologyAddEvent {
    readonly uri: URI;
}

export interface FPGATopologyRemoveEvent {
    readonly model: FPGATopologyModel;
}

export interface ConstrainsUsageTypeSetEvent {
    readonly uris: URI[];
    readonly type: number;
}



@injectable()
export class ProjectManager implements FrontendApplicationContribution {
   
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    @inject(FileDialogService)
    private readonly fileDialogService: FileDialogService;
    
    @inject(MessageService) 
    private readonly messageService: MessageService;

    @inject(FileService)
    private readonly fileService: FileService;

    @inject(FrontendApplicationStateService)
    private readonly stateService: FrontendApplicationStateService;

    @inject(QuickPickService)
    private readonly quickPickService: QuickPickService;

    @inject(QuickInputService)
    private readonly quickInputService: QuickInputService;

    @inject(ProjectManagerBackendService)
    private readonly projManagerBackendService: ProjectManagerBackendService;

    @inject(DatabaseBackendService)
    private readonly databaseBackendService: DatabaseBackendService;

    projRoot: FileStat | undefined;

    protected openedProjects: Project[] = [];
    protected currProj: Project | undefined = undefined;
    protected projToSet: URI | undefined = undefined;

    async onStart(): Promise<void> {
        this.stateService.reachedState('ready').then(
            () => {
                if(this.openedProjects.length > 1){
                    this.setProject(this.openedProjects[0]);
                }
            }
        );
    }

    configure(): void {
        this.doInit();
    }

    protected async doInit(): Promise<void> {

        this.workspaceService.onWorkspaceChanged(async () => {

            await this.refreshProjectsList();

            //If project is only folder in workspace
            if(this.getProjectsCount() > 0) {
                if(this.getProjectsCount() == 1){
                    this.setProject(this.getOpenedProjects()[0]);
                } else if(this.projToSet !== undefined){
                    this.setProject(this.getOpenedProjects().filter(i => i.uri.path.fsPath() == this.projToSet?.path.fsPath())[0]);
                    this.projToSet = undefined;
                } else {
                    this.setProject(this.getOpenedProjects()[0]);
                }
            }

        });

        this.onDidChangeProject((event: ProjectChangeEvent) => {
            this.databaseBackendService.changeDBConnection(event.proj.analyticsDBUri);
            let lld = event.proj.getCurrLLD();
            if(lld){
                this.setLowLevelDesign(lld);
            }
        });

        this.onDidChangeLLD((event: LLDChangeEvent) => {
            this.fireDesignTopModuleChangeEvent(event.lld.rtlModel.topLevelModule);
        });

        if(this.openedProjects.length > 1){
            this.setProject(this.openedProjects[0]);
        }
        
    }

    onWillStop(app: FrontendApplication): boolean | undefined | OnWillStopAction<any>{

        return  {
            action: () => {
                this.saveProjectsMetaData();
                return true;
            },
            reason: 'Saving projects metadata before close',
            priority: 1001
        };

    };

    /* Project */

    async createProject() {

        const templates = await this.projManagerBackendService.getProjectTemplates();
        const items: QuickPickValue<ProjectTemplate>[] = templates.map((e: ProjectTemplate) => <QuickPickValue<ProjectTemplate>>{ label: e.label, value: e });
        let quickPickResult = await this.quickPickService.show(items);
        if(!quickPickResult){
            return;
        }

        const options: OpenFileDialogProps = {
            title: nls.localize("gestola/project-manager/create-gestola-project", "Create Gestola Project"),
            openLabel: nls.localize("gestola/project-manager/create", "Create"),
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(async uri => {

            if (uri) {
                if(await this.isDirEmpty(uri)){
                    if(quickPickResult?.value){
                        await this.projManagerBackendService.createProjectFromTemplate(quickPickResult.value.id, uri);
                        this.projToSet = uri;
                        await this.addProject([uri]);
                    }
                } else {
                    this.messageService.error("Selected directory is not empty");
                }
            }

        });
        
    }

    async openProject(){

        const options: OpenFileDialogProps = {
            title: nls.localize("gestola/project-manager/open-gestola-project", "Open Gestola Project"),
            openLabel: nls.localize("gestola/project-manager/open", "Open"),
            canSelectMany: false,
            canSelectFiles: false,
            canSelectFolders: true
        };

        this.fileDialogService.showOpenDialog(options).then(async uri => {
            if (uri) {
                if(await this.isDirEmpty(uri)){
                    this.messageService.error("Selected directory is not a Gestola project");
                } else {
                    if(await this.checkForGestolaProject(uri)){
                        if(this.openedProjects.filter(i => i.uri === uri).length > 0) {
                            this.setProject(this.openedProjects.filter(i => i.uri === uri)[0]);
                        } else {
                            this.messageService.info("Is Gestola project");
                            this.projToSet = uri;
                            await this.addProject([uri]);
                        }
                    } else {
                        this.messageService.error("Selected directory is not a Gestola project");
                    }
                }
            }

        });

    }

    private async refreshProjectsList(){
        this.openedProjects.length = 0;
        let roots = await this.workspaceService.roots;
        for(let i = 0; i < roots.length; i++){
            if(await this.checkForGestolaProject(roots[i].resource)){
                let j = i;
                if(this.openedProjects.filter(e => e.uri.isEqual(roots[j].resource)).length == 0){
                    this.openedProjects.push(new Project(this, roots[j]));
                }
            }
        }

        this.openedProjects.sort((a, b) => {
            if((a.isFavorite && b.isFavorite) || (!a.isFavorite && !b.isFavorite)){
              return a.name.localeCompare(b.name);	
            } else {
              return a.isFavorite ? -1 : 1;
            }
        });

        this.fireProjectsListChangeEvent();
    }

    async addProjectByDrop(uri: URI | undefined){
        
        if(!uri){
            return;
        }

        if(await this.checkForGestolaProject(uri)){
            await this.addProject([uri]);
        } else {
            this.messageService.error("Selected directory is not a Gestola project");
        }

    }

    async addProject(uri: URI[]){
        this.workspaceService.addRoot(uri);
    }

    async removeProject(proj: Project[]){
        proj.forEach(async e => await this.saveProjectMetaData(e));
        this.workspaceService.removeRoots(proj.map(i => i.uri));
    }

    setProject(proj: Project){
        this.currProj = proj;
        this.fireProjectChangeEvent();
    }

    async saveProjectsMetaData(){
        this.openedProjects.forEach(async e => await this.saveProjectMetaData(e));
    }

    async saveProjectMetaData(proj: Project){
       proj.saveMetadata();
    }


    /*  Low Level Design */

    async createLowLevelDesign() {

        if(!this.currProj) return;

        let quickInputResult = await this.quickInputService.input();

        if(!quickInputResult){
            return;
        }

        if(this.currProj.lowLevelDesignes.map(e => e.name).includes(quickInputResult)){
            this.messageService.error(`Low Level Design ${quickInputResult} already exists`);
            return;
        }

        const templates = await this.projManagerBackendService.getLLDTemplates();
        const items: QuickPickValue<LLDTemplate>[] = templates.map((e: LLDTemplate) => <QuickPickValue<LLDTemplate>>{ label: e.label, value: e });
        let quickPickResult = await this.quickPickService.show(items);
        if(!quickPickResult){
            return;
        }

        let lld = this.currProj.lldsRootUri.resolve(quickInputResult);
        await this.projManagerBackendService.createLLDFromTemplate(quickPickResult.value.id, lld);
        await this.addLowLevelDesign(lld);

    }


    async addLowLevelDesign(modelUri: URI){
        if(this.currProj){
            let model = new LowLevelDesign(this, modelUri);
            this.currProj.addLLD(model);
            this.fireLLDListChangeEvent();
            this.setLowLevelDesign(model);
        }
    }

    async removeLowLevelDesign(model: LowLevelDesign[]){

        if(this.currProj){

            const shouldDelete = await new ConfirmDialog({
                title: 'Delete confirmation',
                msg: model.length > 1 ? `Confirm the deletion of multiple rtl models` : `Confirm the deletion of ${model[0].name}`,
                ok: Dialog.YES,
                cancel: Dialog.CANCEL,
            }).open();

            if(shouldDelete){

                this.currProj.removeLLD(model);
                for(let s of model){
                    await this.fileService.delete(s.uri, {
                        recursive: true,
                        useTrash: true
                    });
                }
                this.fireLLDListChangeEvent();

            }

        }

    }

    setLowLevelDesign(model: LowLevelDesign): void {
        if(this.currProj){
            this.currProj.setCurrLLD(model);
            this.fireLLDChangeEvent(model)
        }
    }

    public includeFilesIntoDesign(uris: URI[]){
        this.getCurrRTLModel()?.includeDesignFiles(uris);
        this.fireDesignFilesIncludeEvent(uris);
    };

    public excludeFilesFromDesign(uris: URI[]){
        this.getCurrRTLModel()?.excludeDesignFiles(uris);
        this.fireDesignFilesExcludeEvent(uris);
    }

    async selectModule(items: string[]): Promise<string | undefined> {

        const qitems: QuickPickValue<string>[] = items.map((e: string) => <QuickPickValue<string>>{ label: e, value: e });
        let quickPickResult = await this.quickPickService.show(qitems);
        return quickPickResult ? quickPickResult.value : undefined; 

    }

    public async setTopModule(uri: URI | undefined){
        if(uri && this.currProj?.curLLD?.rtlModel){
            let descriptions = this.currProj?.curLLD?.rtlModel.hdlFilesDescription.filter(e => e.uri.isEqual(uri));
            if(descriptions.length > 0){
                if(descriptions.length > 1){
                    let moduleName = await this.selectModule(descriptions.map(e => e.module.name));
                    if(moduleName) {
                        this.getCurrRTLModel()?.setDesignTopModule({name: moduleName, uri: descriptions[0].uri});
                        this.fireDesignTopModuleChangeEvent({name: moduleName, uri: descriptions[0].uri});
                    }
                } else {
                    this.getCurrRTLModel()?.setDesignTopModule({name: descriptions[0].module.name, uri: descriptions[0].uri});
                    this.fireDesignTopModuleChangeEvent({name: descriptions[0].module.name, uri: descriptions[0].uri});
                }
            }
        } else {
            this.getCurrRTLModel()?.setDesignTopModule(undefined);
            this.fireDesignTopModuleChangeEvent(undefined);
        }
    }

    public async addTestBenchByUri(uri: URI){

        if(uri && this.currProj?.curLLD?.rtlModel){
            let descriptions = this.currProj?.curLLD?.rtlModel.hdlFilesDescription.filter(e => e.uri.isEqual(uri));
            if(descriptions.length > 0){
                if(descriptions.length > 1){
                    let moduleName = await this.selectModule(descriptions.map(e => e.module.name));
                    if(moduleName) this.addTestBenchByHDLModuleRef({name: moduleName, uri: descriptions[0].uri});
                } else {
                    this.addTestBenchByHDLModuleRef({name: descriptions[0].module.name, uri: descriptions[0].uri});
                }
            }
        } 

    }

    public addTestBenchByHDLModuleRef(module: HDLModuleRef){
        if(module && this.currProj?.curLLD){
            this.getCurrRTLModel()?.addTestBench(module);
            this.fireTestBenchAddEvent(module);
        }
    }

    public removeTestBenchByUri(uris: URI[]){

        if(uris && this.currProj?.curLLD?.rtlModel){
            let modules = this.currProj.curLLD.rtlModel.testbenchesFiles.filter(e => uris.find(i => i.isEqual(e.uri)) !== undefined);
            this.getCurrRTLModel()?.removeTestBenches(modules);
            this.fireTestBenchRemoveEvent(modules);
        }
        
    }

    public removeTestBenchByHDLModuleRef(modules: HDLModuleRef[]){
        this.getCurrRTLModel()?.removeTestBenches(modules);
        this.fireTestBenchRemoveEvent(modules);
    }



    public setFPGATopologyModel(model: FPGATopologyModel | undefined){
        this.getCurrLLD()?.setCurrFPGATopologyModel(model);
        this.fireFPGATopologyModelChangeEvent(model);
    }

    public addFPGATopologyModel(uri: URI){
        this.getCurrLLD()?.createFPGATopologyModel(uri);
        this.fireFPGATopologyModelAddEvent(uri);
    }

    public removeFPGATopologyModel(model: FPGATopologyModel){
        this.getCurrLLD()?.removeFPGATopologyModel(model);
        this.fireFPGATopologyModelRemoveEvent(model);
    }

    public setConstrainsFileUsageType(uri: URI[], type: number){
        this.fireConstrainsUsageTypeSetEvent(uri, type);
    }


    //Context

    setFavorite(proj: Project){
        proj.setFavorite();
        this.fireProjectFavoriteStatusChangeEvent(proj);
    }

   
    //Listeners

    protected readonly onDidChangeProjectEmitter = new Emitter<ProjectChangeEvent>();
    get onDidChangeProject(): Event<ProjectChangeEvent> {
		return this.onDidChangeProjectEmitter.event;
	}
    private fireProjectChangeEvent(){
        this.onDidChangeProjectEmitter.fire({proj: this.currProj} as ProjectChangeEvent);
    }


    protected readonly onDidChangeProjectListEmitter = new Emitter<ProjectsListChangeEvent>();
    get onDidChangeProjectList(): Event<ProjectsListChangeEvent> {
		return this.onDidChangeProjectListEmitter.event;
	}
    private fireProjectsListChangeEvent(){
        this.onDidChangeProjectListEmitter.fire({projects: this.getOpenedProjects()} as ProjectsListChangeEvent);
    }


    protected readonly onDidChangeLLDEmitter = new Emitter<LLDChangeEvent>();
    get onDidChangeLLD(): Event<LLDChangeEvent> {
        return this.onDidChangeLLDEmitter.event;
    }
    private fireLLDChangeEvent(lld: LowLevelDesign){
        this.onDidChangeLLDEmitter.fire({lld: lld} as LLDChangeEvent);
    }


    protected readonly onDidChangeLLDListEmitter = new Emitter<LLDListChangeEvent>();
    get onDidChangeLLDList(): Event<LLDListChangeEvent> {
		return this.onDidChangeLLDListEmitter.event;
	}
    private fireLLDListChangeEvent(){
        this.onDidChangeLLDListEmitter.fire({lld: this.currProj?.lowLevelDesignes} as LLDListChangeEvent);
    }


    protected readonly onDidChangeFavoriteStatusEmitter = new Emitter<ProjectFavoriteStatusChangeEvent>();
    get onDidChangeProjectFavoriteStatus(): Event<ProjectFavoriteStatusChangeEvent> {
        return this.onDidChangeFavoriteStatusEmitter.event;
    }
    private fireProjectFavoriteStatusChangeEvent(proj: Project){
        this.onDidChangeFavoriteStatusEmitter.fire({project: proj} as ProjectFavoriteStatusChangeEvent);
    }


    protected readonly onDidDesignFilesIncludeEmitter = new Emitter<DesignFilesIncludeEvent>();
    get onDidDesignFilesInclude(): Event<DesignFilesIncludeEvent> {
        return this.onDidDesignFilesIncludeEmitter.event;
    }
    private fireDesignFilesIncludeEvent(uris: URI[]){
        this.onDidDesignFilesIncludeEmitter.fire({uris: uris} as DesignFilesIncludeEvent);
    }


    protected readonly onDidDesignFilesExcludeEmitter = new Emitter<DesignFilesExcludeEvent>();
    get onDidDesignFilesExclude(): Event<DesignFilesExcludeEvent> {
        return this.onDidDesignFilesExcludeEmitter.event;
    }
    private fireDesignFilesExcludeEvent(uris: URI[]){
        this.onDidDesignFilesExcludeEmitter.fire({uris: uris} as DesignFilesExcludeEvent);
    }


    protected readonly onDidChangeDesignTopModuleEmitter = new Emitter<DesignTopModuleChangeEvent>();
    get onDidChangeDesignTopModule(): Event<DesignTopModuleChangeEvent> {
        return this.onDidChangeDesignTopModuleEmitter.event;
    }
    private fireDesignTopModuleChangeEvent(module: HDLModuleRef | undefined){
        this.onDidChangeDesignTopModuleEmitter.fire({module: module} as DesignTopModuleChangeEvent);
    }

    // Add Testbench

    protected readonly onDidAddTestBenchEmitter = new Emitter<TestBenchesAddEvent>();
    get onDidAddTestBench(): Event<TestBenchesAddEvent> {
        return this.onDidAddTestBenchEmitter.event;
    }
    private fireTestBenchAddEvent(module: HDLModuleRef){
        this.onDidAddTestBenchEmitter.fire({module: module} as TestBenchesAddEvent);
    }

    // Remove Testbenches

    protected readonly onDidRemoveTestBenchEmitter = new Emitter<TestBenchesRemoveEvent>();
    get onDidRemoveTestBench(): Event<TestBenchesRemoveEvent> {
        return this.onDidRemoveTestBenchEmitter.event;
    }
    private fireTestBenchRemoveEvent(modules: HDLModuleRef[]){
        this.onDidRemoveTestBenchEmitter.fire({modules: modules} as TestBenchesRemoveEvent);
    }

    //Set FPGA Model
    protected readonly onDidChangeFPGATopologyModelEmitter = new Emitter<FPGATopologyModelChangeEvent>();
    get onDidChangeFPGATopologyModel(): Event<FPGATopologyModelChangeEvent> {
        return this.onDidChangeFPGATopologyModelEmitter.event;
    }
    private fireFPGATopologyModelChangeEvent(model: FPGATopologyModel | undefined){
        this.onDidChangeFPGATopologyModelEmitter.fire({model: model} as FPGATopologyModelChangeEvent);
    }

    //Add FPGA Model
    protected readonly onDidAddFPGATopologyModelEmitter = new Emitter<FPGATopologyAddEvent>();
    get onDidAddFPGATopologyModel(): Event<FPGATopologyAddEvent> {
        return this.onDidAddFPGATopologyModelEmitter.event;
    }
    private fireFPGATopologyModelAddEvent(modelUri: URI){
        this.onDidAddFPGATopologyModelEmitter.fire({uri: modelUri} as FPGATopologyAddEvent);
    }

    //Remove FPGA model
    protected readonly onDidRemoveFPGATopologyModelEmitter = new Emitter<FPGATopologyRemoveEvent>();
    get onDidRemoveFPGATopologyModel(): Event<FPGATopologyRemoveEvent> {
        return this.onDidRemoveFPGATopologyModelEmitter.event;
    }
    private fireFPGATopologyModelRemoveEvent(model: FPGATopologyModel){
        this.onDidRemoveFPGATopologyModelEmitter.fire({model: model} as FPGATopologyRemoveEvent);
    }

    //Change constrains set files usage type
    protected readonly onDidSetConstrainsUsageTypeEmitter = new Emitter<ConstrainsUsageTypeSetEvent>();
    get onDidSetConstrainsUsageTypeEvent(): Event<ConstrainsUsageTypeSetEvent> {
        return this.onDidSetConstrainsUsageTypeEmitter.event;
    }
    private fireConstrainsUsageTypeSetEvent(uri: URI[], type: number){
        this.onDidSetConstrainsUsageTypeEmitter.fire({uris: uri, type: type} as ConstrainsUsageTypeSetEvent);
    }



    //Utils

    private async checkForGestolaProject(path: URI) {

        if(! await this.fileService.exists(path)){
            return;
        }

        let dirs = Array.from((await this.getSubDirList(path)).values());
        let check = true;
        
        for (let regexp of Project.regexp) {
            if (dirs.filter( i => i[0].match(regexp)).length !== 1) {check = false; break;}
        }

        return check;

    }

    private async isDirEmpty(path: URI): Promise<boolean> {
        return (await (await this.fileService.activateProvider(path.scheme)).readdir(path)).length === 0;
    }

    private async getSubDirList(path: URI) {
        return await (await this.fileService.activateProvider(path.scheme)).readdir(path);
    }

    public getOpenedProjects(): Project[]{
        return this.openedProjects.slice();
    }

    public getOpenedProject(uri: URI) : Project[] {
        return this.openedProjects.filter(i => i.uri.path.fsPath() === uri.path.fsPath());
    }

    public isOpenedProject(uri: URI) : boolean{
        return this.openedProjects.filter(i => i.uri.path.fsPath() === uri.path.fsPath()).length > 0;
    }

    public getProjectsCount(): number {
        return this.openedProjects.length;
    }

    public getCurrProject(): Readonly<Project | undefined> {
        return this.currProj;
    }

    public getCurrLLD(): Readonly<LowLevelDesign | undefined> {
        return this.currProj?.getCurrLLD();
    }

    public getCurrRTLModel(): Readonly<RTLModel | undefined> {
        return this.getCurrLLD()?.getRTLModel();
    }

    public getFileSerivce(): FileService {
        return this.fileService;
    }

    public getDatabaseService(): DatabaseBackendService {
        return this.databaseBackendService;
    }



}