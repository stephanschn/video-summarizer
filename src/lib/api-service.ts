import { toast } from "sonner";
import { ApiKeyConfig, SummaryResult, MindMapData, MindMapNode, MindMapEdge, Topic, YouTubeVideoInfo } from "./types";
import { YoutubeTranscript } from 'youtube-transcript';

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
      // The Gemini API URL structure has changed, using the correct endpoint
      const apiKey = config.apiKey;
      const url = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

// Fetch video details from YouTube API
export const fetchVideoDetails = async (videoId: string) => {
  try {
    // In a real production app, this would call YouTube Data API directly
    // For demo purposes, we use a simple fetch to get the metadata
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch video details');
    }
    
    const data = await response.json();
    
    return {
      id: videoId,
      title: data.title || `YouTube Video ${videoId}`,
      channelTitle: data.author_name || "Unknown Channel",
      publishedAt: new Date().toISOString(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: data.html || "No description available."
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    // Fallback to basic info if fetching fails
    return {
      id: videoId,
      title: `YouTube Video ${videoId}`,
      channelTitle: "Unknown Channel",
      publishedAt: new Date().toISOString(),
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      description: "Could not fetch video description."
    };
  }
};

// Fetch video transcript from a YouTube video
const fetchVideoTranscript = async (videoId: string): Promise<string> => {
  try {
    // Fetch the actual transcript from YouTube using the youtube-transcript package
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    
    // Combine all transcript parts into a single string
    const transcript = transcriptItems
      .map(item => item.text)
      .join(' ');
    
    if (!transcript || transcript.trim() === '') {
      throw new Error('No transcript available for this video');
    }
    
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch video transcript. This video may not have captions available.');
  }
};

// Generate a summary based on video transcript using AI
export const generateSummary = async (videoId: string, apiConfig: ApiKeyConfig): Promise<SummaryResult> => {
  try {
    // 1. Fetch the video transcript
    const transcript = await fetchVideoTranscript(videoId);
    
    // 2. Generate summary using the appropriate AI model
    if (apiConfig.provider === 'openai') {
      return await generateOpenAISummary(transcript, apiConfig.apiKey);
    } else if (apiConfig.provider === 'gemini') {
      return await generateGeminiSummary(transcript, apiConfig.apiKey);
    }
    
    throw new Error('Unsupported AI provider');
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};

// Extract JSON from AI response text that might contain markdown
const extractJsonFromAIResponse = (content: string): any => {
  try {
    // Check if the response is wrapped in markdown code blocks
    if (content.includes('```json')) {
      // Extract the JSON part from markdown
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
    }
    
    // If not in markdown format, try to parse directly
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    
    // Last attempt - try to find anything that looks like JSON
    try {
      const possibleJson = content.match(/\{[\s\S]*\}/);
      if (possibleJson) {
        return JSON.parse(possibleJson[0]);
      }
    } catch (e) {
      // Give up
      throw new Error('Failed to process the AI response');
    }
    
    throw new Error('Failed to process the AI response');
  }
};

// Generate summary using OpenAI
const generateOpenAISummary = async (transcript: string, apiKey: string): Promise<SummaryResult> => {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Analyze the following video transcript and create a structured summary that includes:
            1. A TLDR (under 30 words)
            2. Main topics (3-7 topics)
            3. Key points for each topic (3-5 bullet points per topic)
            4. Subtopics where relevant (with their own key points)
            
            Format your response as a valid JSON object with the structure:
            {
              "tldr": "Brief summary",
              "topics": [
                {
                  "title": "Main Topic 1",
                  "keyPoints": ["Point 1", "Point 2", "Point 3"],
                  "subtopics": [
                    {
                      "title": "Subtopic 1",
                      "keyPoints": ["Subpoint 1", "Subpoint 2"]
                    }
                  ]
                }
              ]
            }`
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response using the helper function
    return extractJsonFromAIResponse(content);
  } catch (error) {
    console.error('Error with OpenAI summary generation:', error);
    throw error;
  }
};

// Generate summary using Gemini
const generateGeminiSummary = async (transcript: string, apiKey: string): Promise<SummaryResult> => {
  try {
    // Use the available models from the Gemini API (from console logs we can see they've changed)
    // Models like gemini-1.0-pro are no longer available, using gemini-1.5-flash instead
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
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
                text: `Analyze the following video transcript and create a structured summary that includes:
                1. A TLDR (under 30 words)
                2. Main topics (3-7 topics)
                3. Key points for each topic (3-5 bullet points per topic)
                4. Subtopics where relevant (with their own key points)
                
                Format your response as a valid JSON object with the structure:
                {
                  "tldr": "Brief summary",
                  "topics": [
                    {
                      "title": "Main Topic 1",
                      "keyPoints": ["Point 1", "Point 2", "Point 3"],
                      "subtopics": [
                        {
                          "title": "Subtopic 1",
                          "keyPoints": ["Subpoint 1", "Subpoint 2"]
                        }
                      ]
                    }
                  ]
                }
                
                Here's the transcript:
                ${transcript}`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Gemini API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    // Extract the text content from the Gemini response
    const content = data.candidates[0].content.parts[0].text;
    
    // Parse the JSON in the response using the helper function
    return extractJsonFromAIResponse(content);
  } catch (error) {
    console.error('Error with Gemini summary generation:', error);
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

  // Improved layout algorithm to spread nodes more evenly
  const topicSpacing = 2 * Math.PI / summary.topics.length;
  const topicRadius = 300; // Increased radius for more spacing
  const keyPointRadius = 200; // Distance from topic to key points
  const keyPointArc = 0.8; // Controls how wide the key points spread

  // Add main topics
  summary.topics.forEach((topic, topicIndex) => {
    const topicId = `topic-${topicIndex}`;
    const angle = topicSpacing * topicIndex;

    // Position in a circle around the center
    const x = Math.cos(angle) * topicRadius;
    const y = Math.sin(angle) * topicRadius;

    nodes.push({
      id: topicId,
      type: 'topic',
      data: { label: topic.title },
      position: { x, y }
    });

    edges.push({
      id: `edge-center-${topicId}`,
      source: centerId,
      target: topicId,
      animated: false,
      style: { stroke: '#2563eb', strokeWidth: 2 }
    });

    // Add key points for each topic with better positioning
    topic.keyPoints.forEach((keyPoint, keyPointIndex) => {
      const keyPointId = `keypoint-${topicIndex}-${keyPointIndex}`;
      const totalKeyPoints = topic.keyPoints.length;
      const arcStart = angle - (keyPointArc / 2);
      const arcStep = keyPointArc / Math.max(totalKeyPoints - 1, 1);
      const keyPointAngle = totalKeyPoints > 1 
        ? arcStart + keyPointIndex * arcStep 
        : angle;
      
      const offsetX = Math.cos(keyPointAngle) * keyPointRadius;
      const offsetY = Math.sin(keyPointAngle) * keyPointRadius;

      nodes.push({
        id: keyPointId,
        type: 'keypoint',
        data: { label: keyPoint },
        position: {
          x: x + offsetX,
          y: y + offsetY
        }
      });

      edges.push({
        id: `edge-${topicId}-${keyPointId}`,
        source: topicId,
        target: keyPointId,
        style: { stroke: '#f97316', strokeWidth: 1.5 }
      });
    });

    // Add subtopics if any
    if (topic.subtopics && topic.subtopics.length > 0) {
      const subtopicArc = keyPointArc * 0.8;
      const subtopicRadius = 150;
      
      topic.subtopics.forEach((subtopic, subtopicIndex) => {
        const subtopicId = `subtopic-${topicIndex}-${subtopicIndex}`;
        const totalSubtopics = topic.subtopics?.length || 1;
        const subArcStart = angle - (subtopicArc / 2);
        const subArcStep = subtopicArc / Math.max(totalSubtopics - 1, 1);
        const subtopicAngle = totalSubtopics > 1 
          ? subArcStart + subtopicIndex * subArcStep 
          : angle;
        
        const offsetX = Math.cos(subtopicAngle) * subtopicRadius;
        const offsetY = Math.sin(subtopicAngle) * subtopicRadius;

        nodes.push({
          id: subtopicId,
          type: 'subtopic',
          data: { label: subtopic.title },
          position: {
            x: x + offsetX,
            y: y + offsetY
          }
        });

        edges.push({
          id: `edge-${topicId}-${subtopicId}`,
          source: topicId,
          target: subtopicId,
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 1.5 }
        });

        // Add key points for subtopics with better positioning
        subtopic.keyPoints.forEach((keyPoint, keyPointIndex) => {
          const subKeyPointId = `keypoint-sub-${topicIndex}-${subtopicIndex}-${keyPointIndex}`;
          const totalSubKeyPoints = subtopic.keyPoints.length;
          const subKeyArc = subtopicArc * 0.7;
          const subKeyArcStart = subtopicAngle - (subKeyArc / 2);
          const subKeyArcStep = subKeyArc / Math.max(totalSubKeyPoints - 1, 1);
          const subKeyPointAngle = totalSubKeyPoints > 1 
            ? subKeyArcStart + keyPointIndex * subKeyArcStep 
            : subtopicAngle;
          
          const keyOffsetX = Math.cos(subKeyPointAngle) * 120;
          const keyOffsetY = Math.sin(subKeyPointAngle) * 120;

          nodes.push({
            id: subKeyPointId,
            type: 'keypoint',
            data: { label: keyPoint },
            position: {
              x: x + offsetX + keyOffsetX,
              y: y + offsetY + keyOffsetY
            }
          });

          edges.push({
            id: `edge-${subtopicId}-${subKeyPointId}`,
            source: subtopicId,
            target: subKeyPointId,
            style: { stroke: '#f97316', strokeWidth: 1 }
          });
        });
      });
    }
  });

  return { nodes, edges };
};
