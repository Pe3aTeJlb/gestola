import { Widget } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { ProjectManager } from '@gestola/project-manager/lib/frontend/project-manager/project-manager';
import { Solution } from '@gestola/project-manager/lib/frontend/project-manager/solution';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import { ReactTabBarToolbarItem } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
//import { GestolaFileNavigatorWidget } from './file-navigator-widget';

export interface SolutionSelectProps {
    manager: ProjectManager,
    isMultiRoot: boolean
}

export interface SolutionProviderSelectState {
    solutions: Solution[] | undefined,
    currentValue: Solution | undefined
}

@injectable()
export class TabBarSelector implements ReactTabBarToolbarItem {

    id: string = 'SolutionSelector';
    

    @inject(ProjectManager) 
    protected projManager: ProjectManager;

    isVisible(widget: Widget): boolean {
       return true;
    }

    render(widget: Widget): React.ReactNode {
        return <React.Fragment>
            <SolutionSelector
               manager={this.projManager}
               isMultiRoot={false}
            />
        </React.Fragment>;
    }
    
}

export class SolutionSelector extends React.Component<SolutionSelectProps, SolutionProviderSelectState> {

    protected static readonly SEPARATOR = '──────────';
    protected static readonly PICK = '__PICK__';
    protected static readonly NO_CONFIGURATION = '__NO_CONF__';
    protected static readonly ADD_CONFIGURATION = '__ADD_CONF__';
    protected static readonly CONFIG_MARKER = '__CONFIG__';

    private readonly selectRef = React.createRef<SelectComponent>();
    private projManager: ProjectManager;

    constructor(props: SolutionSelectProps) {
        super(props);
        this.projManager = props.manager;
        this.state = {
            solutions: [],
            currentValue: undefined
        };
        this.projManager.onDidChangeSoltionList(() => {
            this.refreshDebugConfigurations();
        });
    }

    override componentDidUpdate(): void {
        // synchronize the currentValue with the selectComponent value
        if (this.selectRef.current?.value !== this.currentValue) {
            this.refreshDebugConfigurations();
        }
    }

    override componentDidMount(): void {
        this.refreshDebugConfigurations();
    }

    override render(): React.ReactNode {
        return <SelectComponent
            options={this.renderOptions()}
            defaultValue={this.state.currentValue?.solutionName}
            onChange={option => this.setCurrentSolution(option)}
            onFocus={() => this.refreshDebugConfigurations()}
            onBlur={() => this.refreshDebugConfigurations()}
            ref={this.selectRef}
        />;
    }

    protected readonly setCurrentSolution = (option: SelectOption) => {
        const value = option.value;
        if (!value) {
            return false;
        } else {
            //this.projManager.setSolutionFromPath(value);
        }
    };

    protected get currentValue(): Solution | undefined {
        //return this.projManager.getCurrProject()?.curSolution;
        return undefined;
    }

    protected refreshDebugConfigurations = async () => {
        const solutions = this.projManager.getCurrProject()?.solutions;
        const value = this.currentValue;
        this.selectRef.current!.value = value?.solutionName;
        this.setState({ solutions, currentValue: value });
    };

    protected renderOptions(): SelectOption[] {
        const options: SelectOption[] = [];
        let proj = this.projManager.getCurrProject();
        if(proj){
            for(let sol of proj.solutions){
                options.push({
                    value: sol.solutionUri.path.fsPath(),
                    label: sol.solutionName
                });
            }
        }
        return options;
    }

}


