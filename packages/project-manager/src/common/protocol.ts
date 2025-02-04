import { URI } from "@theia/core";
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { TaskCustomization } from '@theia/task/lib/common/task-protocol';
import { Project } from "./project";
//import { Database } from "sqlite";

export const ProjectManagerBackendService = Symbol('ProjectManagerBackendService');
export const PROJECT_MANAGER_BACKEND_PATH = '/services/gestolaProjecManagerBackend';
export interface ProjectManagerBackendService {
    getTemplates(): Promise<Template[]>;
    createProjectFromTemplate(templateId: string, uri: URI): Promise<void>;
    updateCurrProject(proj: Project): void;
    updateOpenedProjects(projs: Project[]): void;
}

export const ProjectService = Symbol('ProjectService');
export const PROJECT_SERVICE_PATH = '/services/gestolaProjectService';
export interface ProjectService {
    getProjectConfigState(): Promise<Object>;
    getProject(): Project;
}

export interface Template {
    id: string;
    label: string;
    resourcesPath: string;
    welcomeFile?: string;
    tasks?: (options: TemplateOptions) => TaskCustomization[];
    launches?: (options: TemplateOptions) => DebugConfiguration[];
}

export interface TemplateOptions {
    /** The full path of the selected target folder. */
    targetFolder: string;
    /** The name of the target folder. */
    targetFolderName: string;
}

export const TemplateContribution = Symbol('TemplateContribution');
export interface TemplateContribution {
    readonly templates: Template[];
}



export const DatabaseBackendService = Symbol('DatabaseBackendService');
export const DATABASE_BACKEND_PATH = '/services/gestolaDatabaseBackend';
export interface DatabaseBackendService {
    //createSQLiteConnection(uri: URI): Promise<Database>;
}