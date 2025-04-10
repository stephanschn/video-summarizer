
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
  MarkerType,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  getOutgoers,
  getIncomers,
  getConnectedEdges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from './ui/button'; // Import Button for toggling
import { PlusIcon, MinusIcon } from 'lucide-react'; // Icons for toggle button

interface MindMapProps {
  summary: SummaryResult | null;
}

// Helper function to get all descendant nodes and edges
const getDescendants = (
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[], edges: Edge[] } => {
  const outgoers = new Set<string>();
  const connectingEdges = new Set<string>();
  const stack = [nodeId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;
    const children = getOutgoers(nodes.find(n => n.id === currentId)!, nodes, edges);
    const childEdges = getConnectedEdges(nodes.filter(n => n.id === currentId), edges).filter(edge => edge.source === currentId);

    children.forEach(child => {
      if (!outgoers.has(child.id)) {
        outgoers.add(child.id);
        stack.push(child.id);
      }
    });
    childEdges.forEach(edge => connectingEdges.add(edge.id));
  }

  return {
    nodes: nodes.filter(n => outgoers.has(n.id)),
    edges: edges.filter(e => connectingEdges.has(e.id)),
  };
};


// --- Custom Node Components with Toggle ---

interface NodeData {
  label: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (nodeId: string) => void;
  isCollapsible?: boolean; // Indicate if this node type can be collapsed
  nodeId: string; // Pass node ID for the toggle handler
}

function TopicNode({ data, id }: { data: NodeData; id: string }) {
  const handleToggle = () => {
    if (data.onToggleCollapse) {
      data.onToggleCollapse(id);
    }
  };

  return (
    <div className="relative px-4 py-2 shadow-md bg-blue-50 border-2 border-blue-200 text-blue-800 font-medium rounded-md min-w-[120px] max-w-[200px] text-center">
      {data.label}
      {data.isCollapsible && (
         <button
          onClick={handleToggle}
          className="absolute -right-2 -top-2 p-0.5 bg-blue-200 border border-blue-300 rounded-full text-blue-600 hover:bg-blue-300 focus:outline-none"
          aria-label={data.isCollapsed ? 'Expand' : 'Collapse'}
        >
          {data.isCollapsed ? <PlusIcon size={12} /> : <MinusIcon size={12} />}
        </button>
      )}
    </div>
  );
}

function SubtopicNode({ data, id }: { data: NodeData; id: string }) {
    const handleToggle = () => {
    if (data.onToggleCollapse) {
      data.onToggleCollapse(id);
    }
  };
  return (
    <div className="relative px-4 py-2 shadow-md bg-green-50 border-2 border-green-200 text-green-800 font-medium rounded-md min-w-[100px] max-w-[180px] text-center">
      {data.label}
       {data.isCollapsible && (
         <button
          onClick={handleToggle}
          className="absolute -right-2 -top-2 p-0.5 bg-green-200 border border-green-300 rounded-full text-green-600 hover:bg-green-300 focus:outline-none"
          aria-label={data.isCollapsed ? 'Expand' : 'Collapse'}
        >
          {data.isCollapsed ? <PlusIcon size={12} /> : <MinusIcon size={12} />}
        </button>
      )}
    </div>
  );
}

function KeypointNode({ data }: { data: NodeData }) {
  const truncatedLabel = data.label.length > 60 
    ? `${data.label.substring(0, 60)}...` 
    : data.label;
    
  return (
    <div className="px-3 py-1.5 shadow-md bg-orange-50 border-2 border-orange-200 text-orange-800 text-sm rounded-md min-w-[80px] max-w-[160px] text-center">
      {truncatedLabel}
    </div>
  );
}

// --- Main MindMap Component ---

const MindMap: React.FC<MindMapProps> = ({ summary }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  // Regenerate nodes/edges when summary changes
  useEffect(() => {
    if (summary) {
      const { nodes: initialNodes, edges: initialEdges } = generateMindMapData(summary);
      setNodes(initialNodes);
      setEdges(initialEdges);
      setCollapsedNodes(new Set()); // Reset collapsed state on new summary
    } else {
      setNodes([]);
      setEdges([]);
      setCollapsedNodes(new Set());
    }
  }, [summary, setNodes, setEdges]);

  const handleToggleCollapse = useCallback((nodeId: string) => {
    setCollapsedNodes(prevCollapsed => {
      const newCollapsed = new Set(prevCollapsed);
      const isCurrentlyCollapsed = newCollapsed.has(nodeId);
      
      if (isCurrentlyCollapsed) {
        newCollapsed.delete(nodeId);
      } else {
        newCollapsed.add(nodeId);
      }
      
      // Get all descendant nodes and edges
      const descendants = getDescendants(nodeId, nodes, edges);

      // Update the 'hidden' status of descendant nodes and edges
      setNodes(prevNodes =>
        prevNodes.map(n => {
          if (descendants.nodes.some(dn => dn.id === n.id)) {
            return { ...n, hidden: !isCurrentlyCollapsed };
          }
          return n;
        })
      );

      setEdges(prevEdges =>
        prevEdges.map(e => {
          // Hide edges connected *from* a descendant or *to* a descendant that isn't the toggled node itself
           if (descendants.edges.some(de => de.id === e.id)) {
             return { ...e, hidden: !isCurrentlyCollapsed };
           }
           return e;
        })
      );
      
      return newCollapsed;
    });
  }, [nodes, edges, setNodes, setEdges]);


  // Add collapse handler and state to node data
  const nodesWithCollapse = useMemo(() => {
    return nodes.map(node => {
      const isCollapsible = node.type === 'topic' || node.type === 'subtopic'; // Define which types are collapsible
       // Only add toggle handler if it's collapsible
      const onToggleCollapse = isCollapsible ? handleToggleCollapse : undefined;
      
      return {
        ...node,
        data: {
          ...node.data,
          isCollapsed: collapsedNodes.has(node.id),
          onToggleCollapse: onToggleCollapse,
          isCollapsible: isCollapsible,
          nodeId: node.id
        },
      };
    });
  }, [nodes, collapsedNodes, handleToggleCollapse]);
  
  // Memoize node types to include the modified components
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
        <div className="h-[700px] w-full mindmap-container">
          <ReactFlow
            nodes={nodesWithCollapse}
            edges={edges} // Edges array managed by useEdgesState and updated in handleToggleCollapse
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
            fitViewOptions={{ padding: 0.6 }}
            nodesDraggable={true}
            elementsSelectable={true}
            connectionLineStyle={{ stroke: '#333', strokeWidth: 1.5 }}
            defaultEdgeOptions={{ 
              style: { strokeWidth: 2 }, 
              animated: false,
              markerEnd: {
                type: MarkerType.Arrow,
                color: '#333',
                width: 20,
                height: 20
              }
            }}
          >
            <Background color="#f0f0f0" gap={16} />
            <Controls />
            <MiniMap 
              nodeStrokeWidth={3} 
              zoomable 
              pannable 
              nodeColor={(node) => {
                if (node.hidden) return '#aaa'; // Gray out hidden nodes in minimap
                switch(node.type) {
                  case 'topic': return '#dbeafe';
                  case 'subtopic': return '#dcfce7';
                  case 'keypoint': return '#ffedd5';
                  default: return '#e5e5e5';
                }
              }}
            />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

export default MindMap;
