import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { PanelKind, RevealKind } from '@theia/task/lib/common';
import { ProjectTemplate, ProjectTemplateOptions } from '../common/protocol';

@injectable()
export class GestolaProjectTemplateContribution implements GestolaProjectTemplateContribution {
    get templates(): ProjectTemplate[] {
        return [{
            id: "gestola-project-default-template",
            label: 'Default Template (CMake)',
            welcomeFile: 'README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/project_templates/default').normalizePath().toString(),
            launches: (options: ProjectTemplateOptions) => [{
                'type': 'gdb',
                'request': 'launch',
                'name': `Debug System Model`,
                'program': `\${workspaceFolder}/system/system_model`,
                'initCommands': ['tbreak main'],
                'preLaunchTask': `Binary Build System Model`
            }],
            tasks: (options: ProjectTemplateOptions) => [{
                'label': `Binary Build System Model`,
                'type': 'shell',
                'command': 'cmake . && make',
                'group': {
                    'kind': 'build',
                    'isDefault': true
                },
                'options': {
                    'cwd': `\${workspaceFolder}/system`
                },
                'problemMatcher': []
            },
            {
                'label': `Launch System Model`,
                'type': 'shell',
                'command': './Example',
                'dependsOn': [ `Binary Build System Model` ],
                'presentation': {
                    'echo': true,
                    'reveal': RevealKind.Always,
                    'focus': true,
                    'panel': PanelKind.Shared,
                    'showReuseMessage': false,
                    'clear': true
                },
                'options': {
                    'cwd': `\${workspaceFolder}/system`
                },
                'problemMatcher': []
            }]
        },
        {
            id: "gestola-project-empty-template",
            label: 'Empty Template',
            welcomeFile: 'README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/project_templates/empty').normalizePath().toString()
        },
        ];
    }
}
