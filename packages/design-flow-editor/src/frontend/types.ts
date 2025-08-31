
import { Node, Edge } from '@xyflow/react';


export interface FlowNodeData {
  label: string;
  description?: string;
  type?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
}

export interface FlowData {
  nodes: Node[];
  edges: Edge[];
}

export interface DesignFLowEditorWidgetOptions {
  initialData?: FlowData;
  onNodeDoubleClick?: (node: Node) => void;
  onSelectionChange?: (nodes: Node[]) => void;
}
