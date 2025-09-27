import { ContainerModule, interfaces } from '@theia/core/shared/inversify';
import { bindViewContribution, createTreeContainer, TreeProps } from '@theia/core/lib/browser';

import '@eclipse-emfcloud/theia-tree-editor/style/index.css';
import '@eclipse-emfcloud/theia-tree-editor/style/forms.css';
import '../../style/editor.css';

import { LabelProviderContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TreeEditorContribution } from './tree-contribution';
import { TreeModelService } from './tree-model-service';
import { TreeNodeFactory } from './tree-node-factory';
import { TreeLabelProvider } from './tree-label-provider';
import { DetailFormWidget, MasterTreeWidget, TREE_PROPS, TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { ProjectSettingsEditorWidget } from './project-settings-editor';
import { TreeWidget as TheiaTreeWidget } from '@theia/core/lib/browser/tree';

export default new ContainerModule((bind, _unbind) => {

    // Bind Theia IDE contributions for the tree editor.
    bind(LabelProviderContribution).to(TreeLabelProvider);
    bindViewContribution(bind, TreeEditorContribution);

    // bind services to themselves because we use them outside of the editor widget, too.
    bind(TreeModelService).toSelf().inSingletonScope();
    bind(TreeLabelProvider).toSelf().inSingletonScope();

    bind<WidgetFactory>(WidgetFactory).toDynamicValue(context => ({
        id: ProjectSettingsEditorWidget.ID,
        createWidget: () => {

            const treeContainer = context.container.createChild();
            treeContainer.bind(TreeEditor.ModelService).to(TreeModelService);
            treeContainer.bind(TreeEditor.NodeFactory).to(TreeNodeFactory);
            treeContainer.bind(DetailFormWidget).toSelf();
            treeContainer.bind(MasterTreeWidget).toDynamicValue(context => createTreeWidget(context.container));
            treeContainer.bind(ProjectSettingsEditorWidget).toSelf();

            return treeContainer.get(ProjectSettingsEditorWidget);
        }
    }));

});

function createTreeWidget(parent: interfaces.Container): MasterTreeWidget {
    // eslint-disable-next-line import/no-deprecated
    const treeContainer = createTreeContainer(parent);

    treeContainer.unbind(TheiaTreeWidget);
    treeContainer.bind(MasterTreeWidget).toSelf();
    treeContainer.rebind(TreeProps).toConstantValue(TREE_PROPS);
    return treeContainer.get(MasterTreeWidget);
}