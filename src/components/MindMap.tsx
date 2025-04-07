
import React, { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MindMapData, SummaryResult } from '@/lib/types';
import { generateMindMapData } from '@/lib/api-service';
import { ReactFlow, Background, Controls, MiniMap, NodeTypes, EdgeTypes } from '@xyflow/react';
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
    <div className="px-4 py-2 font-medium">
      {data.label}
    </div>
  );
}

function SubtopicNode({ data }: { data: { label: string } }) {
  return (
    <div className="px-4 py-2">
      {data.label}
    </div>
  );
}

function KeypointNode({ data }: { data: { label: string } }) {
  const truncatedLabel = data.label.length > 60 
    ? `${data.label.substring(0, 60)}...` 
    : data.label;
    
  return (
    <div className="px-4 py-2 text-sm">
      {truncatedLabel}
    </div>
  );
}

const MindMap: React.FC<MindMapProps> = ({ summary }) => {
  const [mindMapData, setMindMapData] = useState<MindMapData | null>(null);

  useEffect(() => {
    if (summary) {
      const data = generateMindMapData(summary);
      setMindMapData(data);
    }
  }, [summary]);

  if (!summary || !mindMapData) return null;

  return (
    <Card className="w-full animate-fade-in">
      <CardHeader className="p-4">
        <CardTitle>Mind Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[600px] w-full mindmap-container">
          <ReactFlow
            nodes={mindMapData.nodes}
            edges={mindMapData.edges}
            nodeTypes={nodeTypes}
            fitView
            minZoom={0.2}
            maxZoom={1.5}
            defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
          >
            <Background />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
};

export default MindMap;
