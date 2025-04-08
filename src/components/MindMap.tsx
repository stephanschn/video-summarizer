
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryResult } from '@/lib/types';
import { generateMindMapData } from '@/lib/api-service';
import { ReactFlow, Background, Controls, MiniMap, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

interface MindMapProps {
  summary: SummaryResult | null;
}

const nodeTypes: NodeTypes = {
  topic: TopicNode,
  subtopic: SubtopicNode,
  keypoint: KeypointNode
};

function TopicNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md bg-blue-50 border-2 border-blue-200 text-blue-800 font-medium rounded-md min-w-[120px] max-w-[200px] text-center">
      {data.label}
    </div>
  );
}

function SubtopicNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2 shadow-md bg-green-50 border-2 border-green-200 text-green-800 font-medium rounded-md min-w-[100px] max-w-[180px] text-center">
      {data.label}
    </div>
  );
}

function KeypointNode({ data }: { data: { label: string } }) {
  const truncatedLabel = data.label.length > 60 
    ? `${data.label.substring(0, 60)}...` 
    : data.label;
    
  return (
    <div className="px-3 py-1.5 shadow-md bg-orange-50 border-2 border-orange-200 text-orange-800 text-sm rounded-md min-w-[80px] max-w-[160px] text-center">
      {truncatedLabel}
    </div>
  );
}

const MindMap: React.FC<MindMapProps> = ({ summary }) => {
  if (!summary) return null;
  
  const mindMapData = generateMindMapData(summary);

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="p-4">
        <CardTitle>Mind Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[700px] w-full mindmap-container">
          <ReactFlow
            nodes={mindMapData.nodes}
            edges={mindMapData.edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.1}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
            fitViewOptions={{ padding: 0.6 }} /* Increased padding for better spacing */
            nodesDraggable={true}
            elementsSelectable={true}
            connectionLineStyle={{ stroke: '#333', strokeWidth: 1.5 }}
            defaultEdgeOptions={{ 
              style: { strokeWidth: 2 }, 
              animated: false,
              markerEnd: {
                type: 'arrow',
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
                switch(node.type) {
                  case 'topic': return '#dbeafe';  // Light blue
                  case 'subtopic': return '#dcfce7'; // Light green
                  case 'keypoint': return '#ffedd5'; // Light orange
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
