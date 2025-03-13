import { inject, injectable, named } from '@theia/core/shared/inversify';
import { ProjectManagerBackendService, Template, TemplateContribution } from '../common/protocol';
import { ContributionProvider, URI } from '@theia/core';
import * as fs from 'fs';
import * as fsextra from 'fs-extra';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { TaskConfiguration } from '@theia/task/lib/common';
import { defProjStruct } from '../common/project';
import { IProject }  from '../common/project';
import { ProjectService } from '../common/protocol';

@injectable()
export class ProjectManagerBackendServiceImpl implements ProjectManagerBackendService, ProjectService {

    currProj: IProject;
    openedProjects: IProject[];

    @inject(ContributionProvider) @named(TemplateContribution)
    protected readonly tempaltesProvider: ContributionProvider<TemplateContribution>;

    async getTemplates(): Promise<Template[]> {
        const contributions = this.tempaltesProvider.getContributions();
        return contributions.flatMap(contribution => contribution.templates);
    }

    async createProjectFromTemplate(templateId: string, projectUri: URI): Promise<void> {

        this.createDirStructure(projectUri, defProjStruct);
        
        const defaultTemplate = (await this.getTemplates()).find(e => e.id === "gestola-empty-template");
        if(defaultTemplate !== undefined){
            const templateUri = new URI(defaultTemplate.resourcesPath);
            const templatePath = FileUri.fsPath(templateUri);
            this.copyFiles(FileUri.fsPath(projectUri), templatePath);
        }

        if(templateId === "gestola-empty-template"){
            return;
        }

        const resolvedTemplate = (await this.getTemplates()).find(e => e.id === templateId);
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

    async createDirStructure(basePath: URI, struct: string[]){
        for (let i = 0; i < struct.length; i++) {
            fs.mkdir(basePath.path.join(struct[i]).fsPath(), (error) => {console.log(error)});
        }
    }

    protected copyFiles(targetPath: string, templatePath: string): void {
        fsextra.copySync(templatePath, targetPath, { recursive: true, errorOnExist: true });
    }

    protected createOrAmendTasksJson(template: Template, projectRoot: URI): void {
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

    protected createOrAmendLaunchJson(template: Template, projectRoot: URI): void {
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