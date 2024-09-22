import { URI } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { PanelKind, RevealKind } from '@theia/task/lib/common';
import { Template, TemplateOptions } from '../common/protocol';

@injectable()
export class GestolaTemplateContribution implements GestolaTemplateContribution {
    get templates(): Template[] {
        return [{
            id: "gestola-default-template",
            label: 'Default Template (CMake)',
            welcomeFile: 'README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/templates/default').normalizePath().toString(),
            launches: (options: TemplateOptions) => [{
                'type': 'gdb',
                'request': 'launch',
                'name': `Debug System Model`,
                'program': `\${workspaceFolder}/system/system_model`,
                'initCommands': ['tbreak main'],
                'preLaunchTask': `Binary Build System Model`
            }],
            tasks: (options: TemplateOptions) => [{
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
            id: "gestola-empty-template",
            label: 'Empty Template',
            welcomeFile: 'README.md',
            resourcesPath: new URI(__dirname).resolve('../../resources/templates/empty').normalizePath().toString()
        },
        ];
    }
}
