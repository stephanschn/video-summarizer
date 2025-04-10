
import { toast } from "sonner";
import { ApiKeyConfig, SummaryResult, MindMapData, MindMapNode, MindMapEdge, Topic, YouTubeVideoInfo } from "./types";
import { YoutubeTranscript } from 'youtube-transcript';

// --- API Key Management --- (Functions remain the same)
export const saveApiKey = (config: ApiKeyConfig): void => {
  try {
    localStorage.setItem('video-summarizer-api-config', JSON.stringify(config));
    toast.success(`${config.provider.toUpperCase()} API key saved`); 
  } catch (error) {
    console.error('Error saving API key to localStorage:', error);
    toast.error('Failed to save API key');
  }
};

export const getApiKey = (): ApiKeyConfig | null => {
  try {
    const stored = localStorage.getItem('video-summarizer-api-config');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error retrieving API key from localStorage:', error);
    return null;
  }
};

export const deleteApiKey = (): void => {
  try {
    localStorage.removeItem('video-summarizer-api-config');
    toast.info('API key removed from browser storage');
  } catch (error) {
    console.error('Error removing API key from localStorage:', error);
    toast.error('Failed to remove API key');
  }
};

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
      return response.ok;
    }
    
    if (config.provider === 'gemini') {
      const apiKey = config.apiKey;
      // Ensure using the correct, stable endpoint if v1beta isn't needed
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
          // Provide a more specific error message if possible
          throw new Error(data.error?.message || `Failed to connect to Gemini API (${response.status})`);
      }
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('API Connection Test Error:', error);
    return false;
  }
};


// --- YouTube Data Handling --- (Functions remain the same)
export const extractVideoId = (url: string): string | null => {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
};

export const fetchVideoDetails = async (videoId: string): Promise<YouTubeVideoInfo> => {
  try {
    // Using noembed.com as a simple oEmbed provider
    const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`); 
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to fetch video details from noembed: ${response.status} ${errorText}`);
      throw new Error('Failed to fetch video details (noembed)');
    }
    const data = await response.json();
    
    if (data.error) { // Check for specific error message from noembed
         console.error(`noembed error: ${data.error}`);
         throw new Error(`Failed to fetch video details: ${data.error}`);
    }

    return {
      id: videoId,
      title: data.title || `YouTube Video ${videoId}`,
      channelTitle: data.author_name || "Unknown Channel",
      publishedAt: new Date().toISOString(), // No publish date from noembed
      thumbnailUrl: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, // Use thumbnail from noembed if available
      description: "Description not available via noembed."
    };
  } catch (error) {
    console.error('Error fetching video details:', error);
    // Fallback to basic info if fetching fails completely
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

const fetchVideoTranscript = async (videoId: string): Promise<string> => {
  try {
    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
    const transcript = transcriptItems.map(item => item.text).join(' ');
    if (!transcript || transcript.trim() === '') {
        throw new Error('Empty transcript received'); // Treat empty transcript as an error for fallback
    }
    return transcript;
  } catch (error) {
    console.warn("youtube-transcript fetch failed or returned empty, using fallback:", error);
    try {
        const videoDetails = await fetchVideoDetails(videoId);
        // Provide a clearer fallback message
        return `Simulated transcript for: "${videoDetails.title}". (Real transcript unavailable)`;
    } catch (detailsError) {
         console.error("Error fetching video details for fallback transcript:", detailsError);
         // Throw a more specific error if fallback fails too
         throw new Error('Failed to fetch transcript and fallback details.'); 
    }
  }
};


// --- AI Summary Generation --- (Functions remain the same)

const extractJsonFromAIResponse = (content: string): any => {
    // Prioritize extracting from markdown code blocks
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (e) {
        console.error("Failed to parse JSON from markdown block:", e);
        // Fallthrough to try parsing the whole content
      }
    }
    
    // If no markdown block, or if parsing failed, try parsing the whole content
    try {
        return JSON.parse(content);
    } catch (parseError) {
        console.error('Failed to parse AI response JSON directly:', parseError, 'Raw content:', content);
         // Final attempt: look for any object-like structure (less reliable)
        try {
          const possibleJson = content.match(/\{\s*"[\s\S]*\}/);
          if (possibleJson) {
            return JSON.parse(possibleJson[0]);
          }
        } catch (e) { /* Ignore final attempt error */ }
        throw new Error('Failed to extract valid JSON from AI response');
  }
};

// Updated prompts for clarity and robustness, requesting ONLY JSON
const SYSTEM_PROMPT_JSON = `Analyze the provided video transcript. Create a structured summary formatted ONLY as a valid JSON object. Do NOT include any text before or after the JSON object, and do not use markdown formatting like \`\`\`json ... \`\`\`. The JSON object must have the structure: {"tldr": "Brief summary (under 30 words)", "topics": [{"title": "Main Topic", "keyPoints": ["Point 1", ...], "subtopics": [{"title": "Subtopic", "keyPoints": ["Subpoint 1", ...]}]}]}. Include 3-7 main topics, each with 3-5 key points. Add subtopics (with 2-4 key points each) ONLY where relevant and meaningful divisions exist within a main topic.`;

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
          { role: 'system', content: SYSTEM_PROMPT_JSON },
          { role: 'user', content: `Transcript: ${transcript}` }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" } 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse OpenAI error response' } }));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Assuming response_format works, parse the content directly
    const messageContent = data.choices[0].message?.content;
    if (!messageContent) {
         throw new Error("OpenAI response missing content.");
    }
    return JSON.parse(messageContent);
  } catch (error) {
    console.error('Error with OpenAI summary generation:', error);
    // Re-throw original error or a new one if parsing failed
    throw error instanceof Error ? error : new Error('Failed to generate OpenAI summary'); 
  }
};

const generateGeminiSummary = async (transcript: string, apiKey: string): Promise<SummaryResult> => {
  try {
    // Using latest stable model and v1beta for JSON response format support
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`; 
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          { parts: [{ text: `${SYSTEM_PROMPT_JSON}

Transcript: ${transcript}` }] }
        ],
        generationConfig: {
          temperature: 0.3,
          response_mime_type: "application/json", 
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Failed to parse Gemini error response' } }));
      throw new Error(`Gemini API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    // Even with JSON mime type, Gemini might send text/plain containing JSON string
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
     if (!content) {
         throw new Error("Gemini response missing content.");
    }
    // Use robust extractor as Gemini might still add markdown
    return extractJsonFromAIResponse(content); 
  } catch (error) {
    console.error('Error with Gemini summary generation:', error);
    throw error instanceof Error ? error : new Error('Failed to generate Gemini summary');
  }
};

export const generateSummary = async (videoId: string, apiConfig: ApiKeyConfig): Promise<SummaryResult> => {
  try {
    const transcript = await fetchVideoTranscript(videoId);
    if (apiConfig.provider === 'openai') {
      return await generateOpenAISummary(transcript, apiConfig.apiKey);
    } else if (apiConfig.provider === 'gemini') {
      return await generateGeminiSummary(transcript, apiConfig.apiKey);
    }
    throw new Error('Unsupported AI provider specified');
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error; // Re-throw to be handled by the calling component
  }
};


// --- Mind Map Data Generation (Hierarchical Layout Redesign) ---

export const generateMindMapData = (summary: SummaryResult): MindMapData => {
    const nodes: MindMapNode[] = [];
    const edges: MindMapEdge[] = [];
    let currentY = 0;

    // Layout constants
    const xStepTopic = 300;        // Horizontal distance between layers (Center -> Topic)
    const xStepSubtopic = 250;     // Horizontal distance (Topic -> Subtopic)
    const xStepKeypoint = 200;   // Horizontal distance (Parent -> Keypoint)
    
    const yPadding = 40;         // Vertical padding between sibling groups
    const yStepNode = 50;          // Estimated vertical space per node (adjust based on node height)
    const keypointXOffset = 20;    // Slight horizontal offset for keypoints for visual distinction

    // Center Node
    const centerId = 'center';
    const centerNode: MindMapNode = {
        id: centerId,
        type: 'topic', // Use a distinct type or style if needed
        data: { label: 'Video Summary' },
        position: { x: 0, y: 0 }, // Start center node at origin
        style: { width: 180, height: 50, fontSize: '1.1em', fontWeight: 'bold' }
    };
    nodes.push(centerNode);
    currentY = centerNode.position.y + yStepNode; // Initial Y offset below center

    // Track Y position for each level to avoid overlap
    let topicStartY = currentY;

    summary.topics.forEach((topic, topicIndex) => {
        const topicId = `topic-${topicIndex}`;
        const topicX = xStepTopic;
        
        // --- Calculate Height needed for this topic branch --- 
        let branchHeight = yStepNode; // Start with topic node height
        let subtopicTotalHeight = 0;
        let keypointTotalHeight = topic.keyPoints.length * yStepNode;

        if (topic.subtopics && topic.subtopics.length > 0) {
            topic.subtopics.forEach(sub => {
                subtopicTotalHeight += yStepNode; // Subtopic node height
                subtopicTotalHeight += sub.keyPoints.length * yStepNode; // Height for subtopic's keypoints
            });
        }
        branchHeight += Math.max(keypointTotalHeight, subtopicTotalHeight);
        // --- End Height Calculation --- 

        const topicY = topicStartY;

        // Add Topic Node
        nodes.push({
            id: topicId,
            type: 'topic',
            data: { label: topic.title },
            position: { x: topicX, y: topicY }
        });
        edges.push({
            id: `edge-center-${topicId}`,
            source: centerId,
            target: topicId,
        });

        let currentBranchY = topicY; // Y counter for elements within this branch
        let keypointBranchY = topicY; // Separate Y counter if keypoints and subtopics are side-by-side (optional)
        let subtopicBranchY = topicY;

        // Add Key Points for Topic
        const topicKeypointX = topicX + xStepSubtopic; // Place keypoints at the same level as subtopics
        topic.keyPoints.forEach((keyPoint, kpIndex) => {
            const kpId = `kp-${topicIndex}-${kpIndex}`;
            nodes.push({
                id: kpId,
                type: 'keypoint',
                data: { label: keyPoint },
                position: { x: topicKeypointX + keypointXOffset, y: keypointBranchY }
            });
            edges.push({ id: `edge-${topicId}-${kpId}`, source: topicId, target: kpId });
            keypointBranchY += yStepNode;
        });
        
        // Add Subtopics and their Key Points
        if (topic.subtopics && topic.subtopics.length > 0) {
            const subtopicX = topicX + xStepSubtopic;
            topic.subtopics.forEach((subtopic, subIndex) => {
                const subtopicId = `sub-${topicIndex}-${subIndex}`;
                nodes.push({
                    id: subtopicId,
                    type: 'subtopic',
                    data: { label: subtopic.title },
                    position: { x: subtopicX, y: subtopicBranchY }
                });
                edges.push({ id: `edge-${topicId}-${subtopicId}`, source: topicId, target: subtopicId });
                
                subtopicBranchY += yStepNode; // Move Y for the next element (keypoint or next subtopic)
                
                // Add Key Points for Subtopic
                const subKeypointX = subtopicX + xStepKeypoint;
                subtopic.keyPoints.forEach((subKeyPoint, skpIndex) => {
                    const skpId = `skp-${topicIndex}-${subIndex}-${skpIndex}`;
                    nodes.push({
                        id: skpId,
                        type: 'keypoint',
                        data: { label: subKeyPoint },
                        position: { x: subKeypointX + keypointXOffset, y: subtopicBranchY }
                    });
                    edges.push({ id: `edge-${subtopicId}-${skpId}`, source: subtopicId, target: skpId });
                    subtopicBranchY += yStepNode;
                });
                // Add padding *after* a subtopic and its keypoints
                subtopicBranchY += yPadding / 2; 
            });
        }
        
        // Update overall Y position for the next topic
        topicStartY += branchHeight + yPadding; 

    });
    
    // Adjust center node's Y position to be vertically centered relative to topics
    if (nodes.length > 1) {
        const firstTopicY = nodes.find(n => n.id === 'topic-0')?.position.y || 0;
        const lastNodeY = Math.max(...nodes.map(n => n.position.y + yStepNode)); // Estimate bottom position
        centerNode.position.y = (firstTopicY + (lastNodeY - firstTopicY) / 2) - yStepNode / 2;
    }

    return { nodes, edges };
};
