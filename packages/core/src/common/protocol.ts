import { URI } from "@theia/core";
import { DebugConfiguration } from '@theia/debug/lib/common/debug-configuration';
import { TaskCustomization } from '@theia/task/lib/common/task-protocol';

export const ProjectManagerBackendService = Symbol('ProjectManagerBackendService');
export const PROJECT_MANAGER_BACKEND_PATH = '/services/gestolaProjecManagerBackend';
export interface ProjectManagerBackendService {
    getTemplates(): Promise<Template[]>;
    createProjectFromTemplate(template: Template, uri: URI): Promise<void>;
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