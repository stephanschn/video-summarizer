
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryResult, Topic, YouTubeVideoInfo } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface VideoSummaryProps {
  videoInfo: YouTubeVideoInfo | null;
  summary: SummaryResult | null;
}

// Helper function to format timestamp for YouTube link
const formatTimestampForLink = (seconds: number): string => {
  // YouTube's URL format for timestamps is t=XXs or t=XXmYYs
  if (seconds < 60) {
    return `${seconds}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m${remainingSeconds}s` : `${minutes}m`;
  }
};

// Generate keyframe thumbnail URL from video ID and timestamp
const generateThumbnailUrl = (videoId: string, timestamp: number): string => {
  // YouTube thumbnail at specific timestamp works by adding &t={seconds}s to the URL
  return `https://i.ytimg.com/vi_webp/${videoId}/mqdefault.webp?&t=${timestamp}s`;
};

// Mock timestamps for demonstration
// In a real app, these would come from the API or transcript analysis
const generateMockTimestamp = (topicIndex: number, videoLength: number = 600): number => {
  // This creates evenly distributed timestamps through the video
  return Math.floor((topicIndex + 1) * (videoLength / (topicIndex + 5)));
};

const VideoSummary: React.FC<VideoSummaryProps> = ({ videoInfo, summary }) => {
  if (!videoInfo || !summary) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/3">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{videoInfo.title}</CardTitle>
              <CardDescription>{videoInfo.channelTitle}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <img 
                src={videoInfo.thumbnailUrl} 
                alt={videoInfo.title} 
                className="w-full h-auto rounded-md mb-4" 
              />
              <a 
                href={`https://www.youtube.com/watch?v=${videoInfo.id}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary hover:underline block text-center"
              >
                Watch on YouTube
              </a>
            </CardContent>
          </Card>
        </div>
        
        <div className="w-full md:w-2/3">
          <Card>
            <CardHeader className="p-4 pb-0">
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">TL;DR</h3>
                <p className="text-muted-foreground">{summary.tldr}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Key Topics</h3>
                <div className="space-y-4">
                  {summary.topics.map((topic, index) => (
                    <TopicSection 
                      key={index} 
                      topic={topic} 
                      index={index} 
                      videoId={videoInfo.id}
                      timestamp={generateMockTimestamp(index)}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

interface TopicSectionProps {
  topic: Topic;
  index: number;
  videoId: string;
  timestamp: number;
}

const TopicSection: React.FC<TopicSectionProps> = ({ topic, index, videoId, timestamp }) => {
  const timestampFormatted = formatTimestampForLink(timestamp);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${timestampFormatted}`;
  const thumbnailUrl = generateThumbnailUrl(videoId, timestamp);
  
  return (
    <div className="border-b pb-4">
      <div className="flex items-start justify-between">
        <h4 className="font-semibold text-md mb-2">{topic.title}</h4>
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center text-xs text-primary hover:underline ml-2"
        >
          {timestamp < 60 ? 
            `${timestamp}s` : 
            `${Math.floor(timestamp/60)}:${(timestamp%60).toString().padStart(2, '0')}`}
          <ExternalLink className="h-3 w-3 ml-1" />
        </a>
      </div>
      
      <div className="flex items-start gap-3 mb-3">
        <a 
          href={videoUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <img 
            src={thumbnailUrl} 
            alt={`Thumbnail at ${timestampFormatted}`}
            className="w-24 h-auto rounded border border-gray-200"
          />
        </a>
        <div className="pl-0 space-y-4 w-full">
          <div>
            <h5 className="font-medium mb-2 text-sm">Key Points</h5>
            <ul className="list-disc pl-5 space-y-1">
              {topic.keyPoints.map((point, i) => (
                <li key={i} className="text-muted-foreground">{point}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      {topic.subtopics && topic.subtopics.length > 0 && (
        <div>
          <h5 className="font-medium mb-2 text-sm">Subtopics</h5>
          <div className="space-y-3">
            {topic.subtopics.map((subtopic, subIndex) => {
              const subTimestamp = timestamp + 20 + (subIndex * 30);
              const subVideoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${formatTimestampForLink(subTimestamp)}`;
              const subThumbnailUrl = generateThumbnailUrl(videoId, subTimestamp);
              
              return (
                <div key={`${index}-${subIndex}`} className="border-l-2 border-gray-200 pl-4">
                  <div className="flex items-start justify-between">
                    <h6 className="font-medium mb-1">{subtopic.title}</h6>
                    <a 
                      href={subVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-xs text-primary hover:underline ml-2"
                    >
                      {subTimestamp < 60 ? 
                        `${subTimestamp}s` : 
                        `${Math.floor(subTimestamp/60)}:${(subTimestamp%60).toString().padStart(2, '0')}`}
                      <ExternalLink className="h-3 w-3 ml-1" />
                    </a>
                  </div>
                  
                  <div className="flex items-start gap-3 mb-2">
                    <a 
                      href={subVideoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="shrink-0"
                    >
                      <img 
                        src={subThumbnailUrl} 
                        alt={`Thumbnail at ${formatTimestampForLink(subTimestamp)}`}
                        className="w-20 h-auto rounded border border-gray-200"
                      />
                    </a>
                    <ul className="list-disc pl-5 space-y-1">
                      {subtopic.keyPoints.map((point, i) => (
                        <li key={i} className="text-muted-foreground">{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoSummary;
