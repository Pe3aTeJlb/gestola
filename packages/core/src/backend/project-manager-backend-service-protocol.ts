import { URI } from "@theia/core";


export const ProjectManagerBackendService = Symbol('ProjectManagerBackendService');
export const PROJECT_MANAGER_BACKEND_PATH = '/services/gestolaProjecManagerBackend';

export interface ProjectManagerBackendService {
    test(): Promise<void>
    createProjectFromTemplate(uri: URI, type: string): Promise<void>
}
