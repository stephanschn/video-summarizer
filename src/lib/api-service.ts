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
      const apiKey = config.apiKey;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;
      
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
                  text: "Hello, this is a test message to verify API connectivity.",
                },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      
      if (!response.ok || data.error) {
        console.error('Gemini API error:', data.error || 'Unknown error');
        throw new Error(data.error?.message || 'Failed to connect to Gemini API');
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

// Function to generate a summary based on video content
export const generateSummary = async (videoId: string, apiConfig: ApiKeyConfig): Promise<SummaryResult> => {
  try {
    // In a real implementation, we would:
    // 1. Get the actual video transcript using YouTube API or a third-party service
    // 2. Send the transcript to OpenAI/Gemini for summarization
    // 3. Process the AI response into our format
    
    // For demonstration, we'll use mock data that represents what would be returned
    // by the AI models after processing a real video transcript
    
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (apiConfig.provider === 'openai') {
      // OpenAI implementation would go here in a real app
      // This is a mock response
      return mockSummaryResult();
    }
    
    if (apiConfig.provider === 'gemini') {
      // Gemini implementation would go here in a real app
      // This is a mock response
      return mockSummaryResult();
    }
    
    throw new Error('Unsupported API provider');
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

// Mock summary result - in a real app, this would be generated from the video content
const mockSummaryResult = (): SummaryResult => {
  return {
    tldr: "This video provides a comprehensive overview of machine learning concepts, explaining different types of ML algorithms, their applications, and future trends in the field.",
    topics: [
      {
        title: "Introduction to Machine Learning",
        keyPoints: [
          "Machine learning is a subset of AI that enables systems to learn from data without explicit programming",
          "It's revolutionizing industries from healthcare to finance to transportation",
          "The field has grown exponentially due to increased data availability and computing power"
        ],
        subtopics: [
          {
            title: "Types of Machine Learning",
            keyPoints: [
              "Supervised learning: training on labeled data to make predictions",
              "Unsupervised learning: finding patterns in unlabeled data",
              "Reinforcement learning: learning optimal actions through trial and error feedback"
            ]
          }
        ]
      },
      {
        title: "Common Machine Learning Algorithms",
        keyPoints: [
          "Regression algorithms predict continuous values like house prices or temperature",
          "Classification algorithms categorize data into predefined classes",
          "Clustering algorithms group similar data points without prior labels",
          "Decision trees make decisions by following a tree-like model of decisions"
        ]
      },
      {
        title: "Practical Applications",
        keyPoints: [
          "Computer vision for image recognition and processing",
          "Natural language processing for text analysis and generation",
          "Recommendation systems for personalized content and product suggestions",
          "Autonomous vehicles for self-driving capabilities",
          "Fraud detection in financial transactions"
        ]
      },
      {
        title: "Data Preparation and Feature Engineering",
        keyPoints: [
          "Data cleaning removes inconsistencies and handles missing values",
          "Feature selection identifies the most relevant variables",
          "Feature engineering creates new variables to improve model performance",
          "Data normalization scales features to comparable ranges"
        ]
      },
      {
        title: "Model Evaluation and Validation",
        keyPoints: [
          "Training, validation, and test splits ensure reliable performance assessment",
          "Cross-validation provides robust evaluation on different data subsets",
          "Metrics like accuracy, precision, recall, and F1-score measure performance",
          "Confusion matrices visualize classification results"
        ]
      },
      {
        title: "Challenges and Ethical Considerations",
        keyPoints: [
          "Bias and fairness issues can perpetuate or amplify social inequalities",
          "Model interpretability is crucial for understanding decision-making processes",
          "Privacy concerns arise when models train on personal data",
          "Accountability frameworks are needed for responsible AI deployment"
        ]
      },
      {
        title: "Future Trends in Machine Learning",
        keyPoints: [
          "AutoML is democratizing access by automating model selection and tuning",
          "Edge ML enables on-device processing for privacy and latency benefits",
          "Federated learning allows model training across devices without sharing raw data",
          "Neural architecture search automates the design of optimal neural networks",
          "Multi-modal learning combines different data types for richer understanding"
        ]
      }
    ]
  };
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
