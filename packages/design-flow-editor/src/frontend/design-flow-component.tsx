import * as React from 'react';
import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Connection,
  Edge,
} from '@xyflow/react';
import { FlowData } from './types';

import '@xyflow/react/dist/style.css';

interface FlowComponentProps {
  initialData?: FlowData;
  onNodeDoubleClick?: (node: Node) => void;
  onSelectionChange?: (nodes: Node[]) => void;
  widgetId: string;
}

const FlowComponent: React.FC<FlowComponentProps> = ({
  initialData,
  onNodeDoubleClick,
  onSelectionChange,
  widgetId,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(initialData?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialData?.edges || []);
  const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
  console.log(selectedNodes, setNodes);
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeDoubleClickHandler = useCallback(
    (event: React.MouseEvent, node: Node) => {
      onNodeDoubleClick?.(node as Node);
    },
    [onNodeDoubleClick]
  );

  const onSelectionChangeHandler = useCallback(
    ({ nodes }: { nodes: Node[] }) => {
      const flowNodes = nodes as Node[];
      setSelectedNodes(flowNodes);
      onSelectionChange?.(flowNodes);
    },
    [onSelectionChange]
  );

  // Save state to storage when changes occur
  useEffect(() => {
    const saveState = () => {
      const state: FlowData = { nodes, edges };
      localStorage.setItem(`flow-widget-${widgetId}`, JSON.stringify(state));
    };

    const timeoutId = setTimeout(saveState, 500);
    return () => clearTimeout(timeoutId);
  }, [nodes, edges, widgetId]);

  return (
    <div className="flow-component" style={{ height: '100%', width: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDoubleClick={onNodeDoubleClickHandler}
        onSelectionChange={onSelectionChangeHandler}
        fitView
        deleteKeyCode={['Delete', 'Backspace']}
        multiSelectionKeyCode={['Shift']}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  );
};

export default FlowComponent;