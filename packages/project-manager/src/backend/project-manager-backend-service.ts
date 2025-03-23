import { inject, injectable, named } from '@theia/core/shared/inversify';
import { ProjectManagerBackendService, ProjectTemplate, ProjectTemplateContribution, SolutionTemplate, SolutionTemplateContribution } from '../common/protocol';
import { ContributionProvider, URI } from '@theia/core';
import * as fs from 'fs';
import * as fsextra from 'fs-extra';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { TaskConfiguration } from '@theia/task/lib/common';
import { defProjStruct } from '../common/project';
import { IProject }  from '../common/project';
import { ProjectService } from '../common/protocol';
import { defSolutionStruct } from '../common/solution';

@injectable()
export class ProjectManagerBackendServiceImpl implements ProjectManagerBackendService, ProjectService {

    currProj: IProject;
    openedProjects: IProject[];

    @inject(ContributionProvider) @named(ProjectTemplateContribution)
    protected readonly projectTempaltesProvider: ContributionProvider<ProjectTemplateContribution>;

    @inject(ContributionProvider) @named(SolutionTemplateContribution)
    protected readonly solutionTempaltesProvider: ContributionProvider<SolutionTemplateContribution>;

    async getProjectTemplates(): Promise<ProjectTemplate[]> {
        const contributions = this.projectTempaltesProvider.getContributions();
        return contributions.flatMap(contribution => contribution.templates);
    }

    async createProjectFromTemplate(templateId: string, projectUri: URI): Promise<void> {

        await this.createDirStructure(projectUri, defProjStruct);
        
        const defaultTemplate = (await this.getProjectTemplates()).find(e => e.id === "gestola-project-empty-template");
        if(defaultTemplate !== undefined){
            const templateUri = new URI(defaultTemplate.resourcesPath);
            const templatePath = FileUri.fsPath(templateUri);
            this.copyFiles(FileUri.fsPath(projectUri), templatePath);
        }

        if(templateId === "gestola-project-empty-template"){
            return;
        }

        const resolvedTemplate = (await this.getProjectTemplates()).find(e => e.id === templateId);
        if(resolvedTemplate !== undefined){

            const templateUri = new URI(resolvedTemplate.resourcesPath);
            const templatePath = FileUri.fsPath(templateUri);
            this.copyFiles(FileUri.fsPath(projectUri), templatePath);

            if (resolvedTemplate.tasks || resolvedTemplate.launches) {
                const configFolder = FileUri.fsPath(projectUri.resolve('.theia'));
                fsextra.ensureDirSync(configFolder);
                this.createOrAmendTasksJson(resolvedTemplate, projectUri);
                this.createOrAmendLaunchJson(resolvedTemplate, projectUri);
            }
        }

    }

    async getSolutionTemplates(): Promise<SolutionTemplate[]> {
        const contributions = this.solutionTempaltesProvider.getContributions();
        return contributions.flatMap(contribution => contribution.templates);
    }

    async createSolutionFromTemplate(templateId: string, solutionUri: URI): Promise<void> {

        fs.mkdirSync(solutionUri.path.fsPath());
        
        await this.createDirStructure(solutionUri, defSolutionStruct);
        
        const defaultTemplate = (await this.getProjectTemplates()).find(e => e.id === "gestola-solution-empty-template");
        if(defaultTemplate !== undefined){
            const templateUri = new URI(defaultTemplate.resourcesPath);
            const templatePath = FileUri.fsPath(templateUri);
            this.copyFiles(FileUri.fsPath(solutionUri), templatePath);
        }

        if(templateId === "gestola-empty-solution-template"){
            return;
        }

        const resolvedTemplate = (await this.getProjectTemplates()).find(e => e.id === templateId);
        if(resolvedTemplate !== undefined){

            const templateUri = new URI(resolvedTemplate.resourcesPath);
            const templatePath = FileUri.fsPath(templateUri);
            this.copyFiles(FileUri.fsPath(solutionUri), templatePath);

            if (resolvedTemplate.tasks || resolvedTemplate.launches) {
                const configFolder = FileUri.fsPath(solutionUri.resolve('.theia'));
                fsextra.ensureDirSync(configFolder);
                this.createOrAmendTasksJson(resolvedTemplate, solutionUri);
                this.createOrAmendLaunchJson(resolvedTemplate, solutionUri);
            }
        }

    }

    async createDirStructure(basePath: URI, struct: string[]){
        for (let i = 0; i < struct.length; i++) {
            fs.mkdirSync(basePath.path.join(struct[i]).fsPath());
        }
    }

    protected copyFiles(targetPath: string, templatePath: string): void {
        fsextra.copySync(templatePath, targetPath, { recursive: true, errorOnExist: true });
    }

    protected createOrAmendTasksJson(template: ProjectTemplate, projectRoot: URI): void {
        if (template.tasks) {
            const tasksJsonPath = FileUri.fsPath(projectRoot.resolve('.theia/tasks.json'));
            if (!fs.existsSync(tasksJsonPath)) {
                fs.writeFileSync(tasksJsonPath, `{
                    "version": "2.0.0",
                    "tasks": []
                }`);
            }
            const tasksJson = JSON.parse(fs.readFileSync(tasksJsonPath).toString());
            const existingTaskConfigurations = tasksJson['tasks'] as TaskConfiguration[];
            const newTasks = template.tasks({targetFolder:FileUri.fsPath(projectRoot), targetFolderName:projectRoot.path.name});
            tasksJson['tasks'] = [...existingTaskConfigurations, ...newTasks];
            fs.writeFileSync(tasksJsonPath, JSON.stringify(tasksJson, undefined, 2));
        }
    }

    protected createOrAmendLaunchJson(template: ProjectTemplate, projectRoot: URI): void {
        if (template.launches) {
            const launchJsonPath = FileUri.fsPath(projectRoot.resolve('.theia/launch.json'));
            if (!fs.existsSync(launchJsonPath)) {
                fs.writeFileSync(launchJsonPath, `{
                    "version": "2.0.0",
                    "configurations": []
                }`);
            }
            const launchJson = JSON.parse(fs.readFileSync(launchJsonPath).toString());
            const existingLaunchConfigurations = launchJson['configurations'] as DebugConfiguration[];
            const newLaunchConfigs = template.launches({targetFolder:FileUri.fsPath(projectRoot), targetFolderName:projectRoot.path.name});
            launchJson['configurations'] = [...existingLaunchConfigurations, ...newLaunchConfigs];
            fs.writeFileSync(launchJsonPath, JSON.stringify(launchJson, undefined, 2));
        }
    }

    updateCurrProject(proj: IProject): void {
        this.currProj = proj;
    }

    updateOpenedProjects(projs: IProject[]): void {
        this.openedProjects = projs;
    }

    public getProjectConfigState(): Object {
        return this.currProj;
    }

    public getProject(): IProject {
        return this.currProj;
    }

}