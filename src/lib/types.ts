
export interface ApiKeyConfig {
  provider: 'openai' | 'gemini';
  apiKey: string;
}

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  channelTitle: string;
  publishedAt: string;
  thumbnailUrl: string;
  description: string;
}

export interface SummaryResult {
  tldr: string;
  topics: Topic[];
}

export interface Topic {
  title: string;
  keyPoints: string[];
  subtopics?: Topic[];
}

export interface MindMapNode {
  id: string;
  type: 'topic' | 'subtopic' | 'keypoint';
  data: {
    label: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}
