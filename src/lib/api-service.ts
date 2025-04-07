import { toast } from "sonner";
import { ApiKeyConfig, SummaryResult, MindMapData, MindMapNode, MindMapEdge } from "./types";

// Store API keys in localStorage
export const saveApiKey = (config: ApiKeyConfig): void => {
  localStorage.setItem('video-summarizer-api-config', JSON.stringify(config));
  toast.success(`${config.provider.toUpperCase()} API key saved`);
};

export const getApiKey = (): ApiKeyConfig | null => {
  const stored = localStorage.getItem('video-summarizer-api-config');
  return stored ? JSON.parse(stored) : null;
};

export const deleteApiKey = (): void => {
  localStorage.removeItem('video-summarizer-api-config');
  toast.info('API key removed');
};

// Test API key connection
export const testApiConnection = async (config: ApiKeyConfig): Promise<boolean> => {
  try {
    if (config.provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to connect to OpenAI API');
      }
      
      return true;
    }
    
    if (config.provider === 'gemini') {
      // For Gemini, we can test with a simple completion request
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.apiKey}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: "Hello",
                },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to Gemini API');
      }
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('API Connection Test Error:', error);
    return false;
  }
};

// Extract video ID from YouTube URL
export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

// Fetch video details from YouTube API - in a real app, this would use a backend service
export const fetchVideoDetails = async (videoId: string) => {
  try {
    // This is a mock function - in a real app, this would call YouTube Data API
    // For now, we'll return placeholder data for demonstration
    return {
      id: videoId,
      title: `Video ${videoId}`,
      channelTitle: "Channel Name",
      publishedAt: new Date().toISOString(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: "Video description would appear here."
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    throw error;
  }
};

// Mock function to generate a summary
// In a real app, this would call OpenAI/Gemini API with the transcript
export const generateSummary = async (videoId: string, apiConfig: ApiKeyConfig): Promise<SummaryResult> => {
  try {
    // This is a mock function for demonstration
    // In a real app, this would:
    // 1. Get the video transcript using YouTube API or a third-party service
    // 2. Send the transcript to OpenAI/Gemini for summarization
    // 3. Process the AI response into our format
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock data
    return {
      tldr: "This video discusses the fundamentals of machine learning, covering supervised and unsupervised learning techniques, common algorithms, and practical applications.",
      topics: [
        {
          title: "Introduction to Machine Learning",
          keyPoints: [
            "Definition and importance of machine learning in modern technology",
            "Difference between AI, ML, and deep learning",
            "Historical development of machine learning"
          ],
          subtopics: [
            {
              title: "Types of Machine Learning",
              keyPoints: [
                "Supervised learning: working with labeled data",
                "Unsupervised learning: finding patterns in unlabeled data",
                "Reinforcement learning: learning through feedback"
              ]
            }
          ]
        },
        {
          title: "Common Machine Learning Algorithms",
          keyPoints: [
            "Linear regression for predicting continuous values",
            "Classification algorithms like logistic regression and decision trees",
            "Clustering techniques like K-means"
          ]
        },
        {
          title: "Practical Applications",
          keyPoints: [
            "Image and speech recognition",
            "Recommendation systems",
            "Natural language processing",
            "Autonomous vehicles"
          ]
        },
        {
          title: "Future Trends",
          keyPoints: [
            "AutoML and democratization of machine learning",
            "Edge ML and on-device processing",
            "Advancements in specialized hardware"
          ]
        }
      ]
    };
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

// Generate mind map data from summary
export const generateMindMapData = (summary: SummaryResult): MindMapData => {
  const nodes: MindMapNode[] = [];
  const edges: MindMapEdge[] = [];

  // Create center node
  const centerId = 'center';
  nodes.push({
    id: centerId,
    type: 'topic',
    data: { label: 'Video Summary' },
    position: { x: 0, y: 0 }
  });

  // Add main topics
  summary.topics.forEach((topic, topicIndex) => {
    const topicId = `topic-${topicIndex}`;
    const angle = (2 * Math.PI * topicIndex) / summary.topics.length;
    const radius = 250;

    // Position in a circle around the center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    nodes.push({
      id: topicId,
      type: 'topic',
      data: { label: topic.title },
      position: { x, y }
    });

    edges.push({
      id: `edge-center-${topicId}`,
      source: centerId,
      target: topicId
    });

    // Add key points for each topic
    topic.keyPoints.forEach((keyPoint, keyPointIndex) => {
      const keyPointId = `keypoint-${topicIndex}-${keyPointIndex}`;
      const keyPointAngle = angle + (keyPointIndex - (topic.keyPoints.length - 1) / 2) * 0.2;
      const keyPointRadius = radius + 150;

      nodes.push({
        id: keyPointId,
        type: 'keypoint',
        data: { label: keyPoint },
        position: {
          x: Math.cos(keyPointAngle) * keyPointRadius,
          y: Math.sin(keyPointAngle) * keyPointRadius
        }
      });

      edges.push({
        id: `edge-${topicId}-${keyPointId}`,
        source: topicId,
        target: keyPointId
      });
    });

    // Add subtopics if any
    if (topic.subtopics) {
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        const subtopicId = `subtopic-${topicIndex}-${subtopicIndex}`;
        const subtopicAngle = angle + (subtopicIndex - (topic.subtopics?.length || 0) / 2) * 0.3;
        const subtopicRadius = radius + 100;

        nodes.push({
          id: subtopicId,
          type: 'subtopic',
          data: { label: subtopic.title },
          position: {
            x: Math.cos(subtopicAngle) * subtopicRadius,
            y: Math.sin(subtopicAngle) * subtopicRadius
          }
        });

        edges.push({
          id: `edge-${topicId}-${subtopicId}`,
          source: topicId,
          target: subtopicId,
          animated: true
        });

        // Add key points for subtopics
        subtopic.keyPoints.forEach((keyPoint, keyPointIndex) => {
          const subKeyPointId = `keypoint-sub-${topicIndex}-${subtopicIndex}-${keyPointIndex}`;
          const subKeyPointAngle = subtopicAngle + (keyPointIndex - (subtopic.keyPoints.length - 1) / 2) * 0.15;
          const subKeyPointRadius = subtopicRadius + 100;

          nodes.push({
            id: subKeyPointId,
            type: 'keypoint',
            data: { label: keyPoint },
            position: {
              x: Math.cos(subKeyPointAngle) * subKeyPointRadius,
              y: Math.sin(subKeyPointAngle) * subKeyPointRadius
            }
          });

          edges.push({
            id: `edge-${subtopicId}-${subKeyPointId}`,
            source: subtopicId,
            target: subKeyPointId
          });
        });
      });
    }
  });

  return { nodes, edges };
};
