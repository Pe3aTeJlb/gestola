import { URI } from '@theia/core';

export const VivadoBackendService = Symbol('VivadoBackendService');
export const VIVADO_BACKEND_PATH = '/services/gestolaVivadoBackendService';
export interface VivadoBackendService {
   runVivado(runScript: string[], runPath: URI): Promise<void>;
}