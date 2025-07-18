import { injectable, inject } from '@theia/core/shared/inversify';
import { ProjectManager } from "@gestola/project-manager/lib/frontend/project-manager/project-manager";
import { VivadoBackendService } from '../common/protocol';
import { FPGATopologyModel, USED_IN_IMPL_ONLY, USED_IN_NONE, USED_IN_SYNTH_AND_IMPL, USED_IN_SYTH_ONLY } from '@gestola/project-manager/lib/frontend/project-manager/fpga-topology-model';

@injectable()
export class VivadoFrontendService {

    @inject(ProjectManager)
    protected readonly projManager: ProjectManager;

    @inject(VivadoBackendService)
    private readonly vivadoBackendService: VivadoBackendService;

    public async runVivado(fpgaModels: FPGATopologyModel[]){

        let rtlModel = this.projManager.getCurrRTLModel();
        if(rtlModel && rtlModel.topLevelModule){

            let tclScript: string[] = [];
            tclScript.push(`set project_name vivado_run_instance`);
            tclScript.push(`set origin_dir [file dirname [info script]]`);
            tclScript.push(`cd $origin_dir`);

            tclScript.push(`create_project $project_name $project_name -force -part ${this.projManager.getCurrLLD()!.chip}`);

            for(let file of rtlModel.collectSimSetForTop().map(e => e.path.fsPath())){
                tclScript.push(`add_files -fileset sources_1 ${file}`);
            }

            tclScript.push(`cd $origin_dir`);

            let i = 1;
            for(let model of fpgaModels){
                tclScript.push(`create_fileset -constrset constr_set_${i}`);

                tclScript.push(`set synth_output(constr_set_${i}) ${model.synthResults.path.fsPath()}`);
                tclScript.push(`set impl_output(constr_set_${i}) ${model.implResults.path.fsPath()}`);

                for(let file of model.constrainsFiles){
                    tclScript.push(`add_files -fileset constr_set_${i} ${file.path.fsPath()}`);
                    switch(model.constrainsFilesUsageMap.get(file)){
                        case USED_IN_NONE:
                            tclScript.push(`set_property used_in_synthesis false [get_files  ${file.path.fsPath()}]`);
                            tclScript.push(`set_property used_in_implementation false [get_files  ${file.path.fsPath()}]`);
                        break;
                        case USED_IN_SYTH_ONLY:
                            tclScript.push(`set_property used_in_synthesis true [get_files  ${file.path.fsPath()}]`);
                            tclScript.push(`set_property used_in_implementation false [get_files  ${file.path.fsPath()}]`);
                        break;
                        case USED_IN_IMPL_ONLY:
                            tclScript.push(`set_property used_in_synthesis false [get_files  ${file.path.fsPath()}]`);
                            tclScript.push(`set_property used_in_implementation true [get_files  ${file.path.fsPath()}]`);
                        break;
                        case USED_IN_SYNTH_AND_IMPL:
                          //vivado default
                        break;

                    }
                   
                }

                i++;

            }

            tclScript.push(`set_property constrset constr_set_1 [get_runs synth_1]`);
            tclScript.push(`set_property constrset constr_set_1 [get_runs impl_1]`);
            tclScript.push(`delete_fileset [ get_filesets constrs_1 ]`);


            tclScript.push(`foreach c_set [ get_filesets constr_set_* ] {`);
            tclScript.push('set_property constrset $c_set [get_runs synth_1]');
            tclScript.push('set_property constrset $c_set [get_runs impl_1]');
            tclScript.push(`set_property TOP ${rtlModel.topLevelModule.name} [get_fileset sources_1]`);
            tclScript.push(' reset_run synth_1');
            tclScript.push('launch_runs synth_1 -jobs 16');
            tclScript.push('wait_on_run synth_1');
            tclScript.push('reset_run impl_1');
            tclScript.push('launch_runs impl_1 -jobs 16');
            tclScript.push('wait_on_run impl_1');
            tclScript.push('open_run impl_1');

            tclScript.push('write_checkpoint -file $impl_output($c_set)/checkpoint.dcp');
            tclScript.push('report_timing_summary -file $impl_output($c_set)/timing_report.txt');
            tclScript.push('create_slack_histogram -details -file $impl_output($c_set)/slack.txt');
            tclScript.push('report_power -format xml -file $impl_output($c_set)/power_report.xml');
            tclScript.push('report_utilization -file $impl_output($c_set)/util_report.txt ');
            tclScript.push('}');
            tclScript.push('exit');

            this.vivadoBackendService.runVivado(tclScript, rtlModel.lldUri);
            
        }

    }

}