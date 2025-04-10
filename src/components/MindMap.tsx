
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryResult } from '@/lib/types';
import { generateMindMapData } from '@/lib/api-service';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  NodeTypes,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType // Import MarkerType
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PlusIcon, MinusIcon } from 'lucide-react';

interface MindMapProps {
  summary: SummaryResult | null;
}

// --- Custom Node Components --- 

interface NodeData {
  label: string;
  // Add internal state for visual collapse indication if needed
  isCollapsed?: boolean; 
  // Callback provided by MindMap component
  onToggleCollapse?: (nodeId: string, isCurrentlyCollapsed: boolean) => void; 
  isCollapsible?: boolean;
  nodeId: string;
}

// Base styling for nodes
const nodeBaseStyle = "relative px-3 py-1.5 shadow-md rounded-md text-sm border-2 flex items-center justify-center text-center min-w-[150px] max-w-[220px] min-h-[40px]";
const buttonStyle = "absolute -right-2.5 -top-2.5 p-0.5 rounded-full focus:outline-none z-10 border";

// Topic Node
function TopicNode({ data, id }: { data: NodeData; id: string }) {
  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data.onToggleCollapse) {
      data.onToggleCollapse(id, !!data.isCollapsed);
    }
  };

  return (
    <div className={`${nodeBaseStyle} bg-blue-50 border-blue-300 text-blue-800 font-medium`}>
      <span className="truncate">{data.label}</span>
      {data.isCollapsible && (
        <button
          onClick={handleToggle}
          className={`${buttonStyle} bg-blue-100 border-blue-300 text-blue-600 hover:bg-blue-200`}
          aria-label={data.isCollapsed ? 'Expand' : 'Collapse'}
        >
          {data.isCollapsed ? <PlusIcon size={14} /> : <MinusIcon size={14} />}
        </button>
      )}
    </div>
  );
}

// Subtopic Node
function SubtopicNode({ data, id }: { data: NodeData; id: string }) {
  const handleToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (data.onToggleCollapse) {
      data.onToggleCollapse(id, !!data.isCollapsed);
    }
  };

  return (
    <div className={`${nodeBaseStyle} bg-green-50 border-green-300 text-green-800`}>
      <span className="truncate">{data.label}</span>
       {data.isCollapsible && (
         <button
          onClick={handleToggle}
          className={`${buttonStyle} bg-green-100 border-green-300 text-green-600 hover:bg-green-200`}
          aria-label={data.isCollapsed ? 'Expand' : 'Collapse'}
        >
          {data.isCollapsed ? <PlusIcon size={14} /> : <MinusIcon size={14} />}
        </button>
      )}
    </div>
  );
}

// Keypoint Node (Not collapsible itself)
function KeypointNode({ data }: { data: NodeData }) {
  return (
    <div className={`${nodeBaseStyle} bg-orange-50 border-orange-300 text-orange-800`}>
       <span className="truncate">{data.label}</span>
    </div>
  );
}

// --- Main MindMap Component ---

const MindMap: React.FC<MindMapProps> = ({ summary }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Function to recursively hide/show descendants
  const toggleDescendants = (nodeId: string, hide: boolean, currentNodes: Node[], currentEdges: Edge[]): { updatedNodes: Node[], updatedEdges: Edge[] } => {
      const nodesToUpdate = new Set<string>();
      const edgesToUpdate = new Set<string>();
      const stack: string[] = [nodeId]; // Start with the node being toggled
      const directChildrenEdges = currentEdges.filter(edge => edge.source === nodeId);

      // Find direct children to start the traversal
      directChildrenEdges.forEach(edge => {
          if (!stack.includes(edge.target)) {
              stack.push(edge.target);
          }
          edgesToUpdate.add(edge.id);
      });
      
      // BFS or DFS to find all descendants
      let head = 1; // Start processing from the first child
      while(head < stack.length) {
          const currentId = stack[head++];
          nodesToUpdate.add(currentId);

          const childEdges = currentEdges.filter(edge => edge.source === currentId);
          childEdges.forEach(edge => {
              if (!stack.includes(edge.target)) {
                  stack.push(edge.target);
              }
              edgesToUpdate.add(edge.id);
          });
      }

      // Update nodes
      const updatedNodes = currentNodes.map(node => {
          if (nodesToUpdate.has(node.id)) {
              // Also reset the internal collapsed state for children when expanding parent
              const newIsCollapsed = hide ? node.data.isCollapsed : false;
              return { ...node, hidden: hide, data: { ...node.data, isCollapsed: newIsCollapsed } };
          }
          return node;
      });

      // Update edges
      const updatedEdges = currentEdges.map(edge => {
          if (edgesToUpdate.has(edge.id)) {
              return { ...edge, hidden: hide };
          }
          return edge;
      });

      return { updatedNodes, updatedEdges };
  };

  // Callback for node toggle button
  const handleToggleCollapse = useCallback((nodeId: string, isCurrentlyCollapsed: boolean) => {
      setNodes(prevNodes => {
          // Toggle the clicked node's internal state first
          const toggledNodes = prevNodes.map(n => 
              n.id === nodeId ? { ...n, data: { ...n.data, isCollapsed: !isCurrentlyCollapsed } } : n
          );

          // Then hide/show descendants based on the *new* state
          const { updatedNodes, updatedEdges } = toggleDescendants(nodeId, !isCurrentlyCollapsed, toggledNodes, edges);
          setEdges(updatedEdges); // Update edges state
          return updatedNodes; // Return updated nodes state
      });
  }, [edges, setNodes, setEdges]); // Include edges, setNodes, setEdges

  // Regenerate nodes/edges when summary changes
  useEffect(() => {
    if (summary) {
      const { nodes: initialNodes, edges: initialEdges } = generateMindMapData(summary);
      
      // Initialize nodes: not hidden, not collapsed, add collapsible flag and handler
      const processedNodes = initialNodes.map(n => ({
        ...n,
        hidden: false, 
        data: {
          ...n.data,
          isCollapsed: false, // Start expanded
          isCollapsible: n.type === 'topic' || n.type === 'subtopic',
          onToggleCollapse: (n.type === 'topic' || n.type === 'subtopic') ? handleToggleCollapse : undefined,
          nodeId: n.id
        }
      }));
      
      // Initialize edges: not hidden
      const processedEdges = initialEdges.map(e => ({ ...e, hidden: false }));

      setNodes(processedNodes);
      setEdges(processedEdges);
    } else {
      setNodes([]);
      setEdges([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]); // Rerun only when summary changes; handleToggleCollapse uses useCallback for stability

  
  // Filter out hidden nodes and edges for rendering
  const visibleNodes = useMemo(() => nodes.filter(n => !n.hidden), [nodes]);
  const visibleEdges = useMemo(() => edges.filter(e => !e.hidden), [edges]);

  // Memoize node types 
  const nodeTypes = useMemo<NodeTypes>(() => ({
      topic: TopicNode,
      subtopic: SubtopicNode,
      keypoint: KeypointNode
  }), []);

  if (!summary) return null;

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="p-4">
        <CardTitle>Mind Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[700px] w-full mindmap-container border rounded-md"> 
          <ReactFlow
            nodes={visibleNodes} 
            edges={visibleEdges} 
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            // Increase padding further if needed
            fitViewOptions={{ padding: 0.4, duration: 300 }} 
            nodesDraggable={true}
            nodesConnectable={false} // Usually false for mind maps
            elementsSelectable={true}
            // Basic edge style
            defaultEdgeOptions={{
              style: { stroke: '#555', strokeWidth: 1.5 },
              type: 'smoothstep', // Simple edge type
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 15,
                height: 15,
                color: '#555'
              },
            }}
            connectionLineStyle={{ stroke: '#555', strokeWidth: 1 }}
          >
            <Background color="#eee" gap={20} variant="dots" />
            <Controls />
            <MiniMap 
                nodeStrokeWidth={2}
                nodeColor={(n) => {
                    // Find the original node data for correct color even if hidden
                    const originalNode = nodes.find(node => node.id === n.id);
                    if (originalNode?.hidden) return '#ccc'; // Grey out hidden
                    switch (originalNode?.type) {
                      case 'topic': return '#dbeafe'; // Blue
                      case 'subtopic': return '#dcfce7'; // Green
                      case 'keypoint': return '#ffedd5'; // Orange
                      default: return '#e5e5e5'; // Default grey
                    }
                 }}
                pannable
                zoomable
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

export default MindMap;
