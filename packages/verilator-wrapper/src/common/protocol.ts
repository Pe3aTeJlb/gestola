import { URI } from "@theia/core";

export const VerilatorBackendService = Symbol('VerilatorBackendService');
export const VERILATOR_BACKEND_PATH = '/services/gestolaVerilatorBackendService';
export interface VerilatorBackendService {
   runVerilator(runPath: URI, topLevelName: string, dependencies: URI[]): Promise<void>;
}