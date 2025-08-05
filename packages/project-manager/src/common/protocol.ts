import { URI } from "@theia/core";
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { TaskCustomization } from '@theia/task/lib/common/task-protocol';
import { Database } from "./database";

export const ProjectManagerBackendService = Symbol('ProjectManagerBackendService');
export const PROJECT_MANAGER_BACKEND_PATH = '/services/gestolaProjecManagerBackend';
export interface ProjectManagerBackendService {
    getProjectTemplates(): Promise<ProjectTemplate[]>;
    getLLDTemplates(): Promise<LLDTemplate[]>;
    createProjectFromTemplate(templateId: string, uri: URI): Promise<void>;
    createLLDFromTemplate(templateId: string, uri: URI): Promise<void>;
}



export const ProjectTemplateContribution = Symbol('ProjectTemplateContribution');
export interface ProjectTemplateContribution {
    readonly templates: ProjectTemplate[];
}

export interface ProjectTemplate {
    id: string;
    label: string;
    resourcesPath: string;
    welcomeFile?: string;
    tasks?: (options: ProjectTemplateOptions) => TaskCustomization[];
    launches?: (options: ProjectTemplateOptions) => DebugConfiguration[];
}

export interface ProjectTemplateOptions {
    /** The full path of the selected target folder. */
    targetFolder: string;
    /** The name of the target folder. */
    targetFolderName: string;
}



export const LLDTemplateContribution = Symbol('LLDTemplateContribution');
export interface LLDTemplateContribution {
    readonly templates: LLDTemplate[];
}

export interface LLDTemplate {
    id: string;
    label: string;
    resourcesPath: string;
}



export const DatabaseBackendService = Symbol('DatabaseBackendService');
export const DATABASE_BACKEND_PATH = '/services/gestolaDatabaseBackend';
export interface DatabaseBackendService {
    changeDBConnection(uri: URI): Promise<void>;
    getDatabaseDescription(uri: URI): Promise<Database>;
    getReportSampleDataFor(table: string): Promise<Object[]>;
}