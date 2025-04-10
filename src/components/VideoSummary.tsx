
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SummaryResult, Topic, YouTubeVideoInfo } from '@/lib/types';
import { ExternalLink } from 'lucide-react';

interface VideoSummaryProps {
    videoInfo: YouTubeVideoInfo | null;
    summary: SummaryResult | null;
}

// Helper function to format seconds into YouTube's t=... format
const formatTimestampForLink = (seconds: number): string => {
    const roundedSeconds = Math.max(0, Math.floor(seconds));
    if (roundedSeconds < 60) {
        return `${roundedSeconds}s`;
    } else {
        const minutes = Math.floor(roundedSeconds / 60);
        const remainingSeconds = roundedSeconds % 60;
        return remainingSeconds > 0 ? `${minutes}m${remainingSeconds}s` : `${minutes}m`;
    }
};

// Helper to display timestamp in M:SS format
const formatTimestampDisplay = (seconds: number): string => {
    const roundedSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(roundedSeconds / 60);
    const secs = roundedSeconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Generate a representative thumbnail URL
const generateRepresentativeThumbnailUrl = (videoId: string, imageIndex: 1 | 2 | 3 = 1): string => {
    return `https://i.ytimg.com/vi/${videoId}/${imageIndex}.jpg`;
};

// Mock timestamps for demonstration
// *** FIX: Accept totalTopics as a parameter ***
const generateMockTimestamp = (topicIndex: number, totalTopics: number, videoLength: number = 600): number => {
    // Ensure totalTopics is at least 1 to prevent division by zero or nonsensical distribution
    const validTotalTopics = Math.max(1, totalTopics);
    // Distribute timestamps somewhat evenly based on total topics
    // Adding 1 to validTotalTopics ensures the last topic doesn't end exactly at videoLength
    return Math.floor((topicIndex + 1) * (videoLength / (validTotalTopics + 1)));
};
// --- End of FIX ---

// --- Topic Section Component ---

interface TopicSectionProps {
    topic: Topic;
    index: number;
    videoId: string;
    totalTopics: number; // Prop already exists
}

const TopicSection: React.FC<TopicSectionProps> = ({ topic, index, videoId, totalTopics }) => {
    // *** FIX: Pass totalTopics to the function ***
    const mockTimestamp = generateMockTimestamp(index, totalTopics, 600);
    // --- End of FIX ---
    const timestampParam = formatTimestampForLink(mockTimestamp);
    const videoUrlWithTimestamp = `https://www.youtube.com/watch?v=${videoId}&t=${timestampParam}`;
    const thumbnailIndex = (index % 3 + 1) as 1 | 2 | 3;
    const thumbnailUrl = generateRepresentativeThumbnailUrl(videoId, thumbnailIndex);

    return (
        <div className="border-b last:border-b-0 pb-4 mb-4">
            <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-md mr-2">{topic.title}</h4>
                <a href={videoUrlWithTimestamp} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-primary hover:underline ml-auto flex-shrink-0 whitespace-nowrap" title={`Go to ${formatTimestampDisplay(mockTimestamp)} in video`}>
                    {formatTimestampDisplay(mockTimestamp)}
                    <ExternalLink className="h-3 w-3 ml-1" />
                </a>
            </div>
            <div className="flex items-start gap-3 mb-3">
                <a href={videoUrlWithTimestamp} target="_blank" rel="noopener noreferrer" className="shrink-0" aria-label={`Thumbnail link for topic: ${topic.title}`}>
                    <img
                        src={thumbnailUrl}
                        alt={`Thumbnail for ${topic.title}`}
                        className="w-24 h-auto rounded border border-muted object-cover"
                        loading="lazy"
                        onError={(e) => (e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`)} // Fallback to default
                    />
                </a>
                <div className="space-y-1 w-full">
                    {/* Ensure keyPoints array exists before mapping */} 
                    {topic.keyPoints && topic.keyPoints.length > 0 && (
                        <ul className="list-disc pl-5 space-y-1">
                            {topic.keyPoints.map((point, i) => (
                                <li key={i} className="text-muted-foreground text-sm">{point}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
            {/* Ensure subtopics array exists before mapping */} 
            {topic.subtopics && topic.subtopics.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-muted space-y-3">
                    {topic.subtopics.map((subtopic, subIndex) => {
                        // Ensure subtopic.keyPoints exists
                        const subKeyPoints = subtopic.keyPoints || [];
                        const subTimestamp = mockTimestamp + 15 + (subIndex * 20);
                        const subTimestampParam = formatTimestampForLink(subTimestamp);
                        const subVideoUrl = `https://www.youtube.com/watch?v=${videoId}&t=${subTimestampParam}`;
                        const subThumbnailIndex = ((index + subIndex + 1) % 3 + 1) as 1 | 2 | 3;
                        const subThumbnailUrl = generateRepresentativeThumbnailUrl(videoId, subThumbnailIndex);

                        return (
                            <div key={`${index}-${subIndex}`} className="pt-1">
                                <div className="flex items-start justify-between mb-1">
                                    <h6 className="font-medium text-sm mr-2">{subtopic.title}</h6>
                                    <a href={subVideoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-xs text-primary hover:underline ml-auto flex-shrink-0 whitespace-nowrap" title={`Go to ${formatTimestampDisplay(subTimestamp)} in video`}>
                                        {formatTimestampDisplay(subTimestamp)}
                                        <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                </div>
                                <div className="flex items-start gap-2 mb-1">
                                    <a href={subVideoUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                        <img
                                            src={subThumbnailUrl}
                                            alt={`Thumbnail for ${subtopic.title}`}
                                            className="w-16 h-auto rounded border border-muted object-cover"
                                            loading="lazy"
                                            onError={(e) => (e.currentTarget.src = `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`)} // Fallback
                                        />
                                    </a>
                                    {subKeyPoints.length > 0 && (
                                        <ul className="list-disc pl-4 space-y-0.5 text-sm">
                                            {subKeyPoints.map((point, i) => (
                                                <li key={i} className="text-muted-foreground">{point}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

// --- Main Video Summary Component ---

const VideoSummary: React.FC<VideoSummaryProps> = ({ videoInfo, summary }) => {
    if (!videoInfo || !summary || !summary.topics) { // Add check for summary.topics
         console.warn("VideoSummary rendering skipped due to missing videoInfo or summary data.");
        return null; // Render nothing if essential data is missing
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column: Video Info */} 
                <div className="w-full md:w-1/3">
                     <Card>
                        <CardHeader className="p-4">
                        <CardTitle className="text-lg line-clamp-2">{videoInfo.title}</CardTitle>
                        <CardDescription>{videoInfo.channelTitle}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                        <img
                            src={videoInfo.thumbnailUrl} // Main video thumbnail
                            alt={videoInfo.title}
                            className="w-full h-auto rounded-md mb-3 object-cover"
                            loading="lazy"
                        />
                        <a
                            href={`https://www.youtube.com/watch?v=${videoInfo.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline block text-center"
                        >
                            Watch on YouTube
                        </a>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Summary Details */} 
                <div className="w-full md:w-2/3">
                    <Card>
                        <CardHeader className="p-4 pb-2">
                            <CardTitle>Summary & Key Topics</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                            {/* TLDR Section */} 
                            <div className="mb-4 p-3 bg-muted/50 rounded-md">
                                <h3 className="text-md font-medium mb-1">TL;DR</h3>
                                <p className="text-muted-foreground text-sm">{summary.tldr || "Not available"}</p>
                            </div>

                            {/* Key Topics Section */} 
                            <div>
                                <div className="space-y-0">
                                    {/* Ensure summary.topics exists and is an array before mapping */} 
                                    {Array.isArray(summary.topics) && summary.topics.map((topic, index) => (
                                        <TopicSection
                                            key={index}
                                            topic={topic}
                                            index={index}
                                            videoId={videoInfo.id}
                                            // Pass the total number of topics here
                                            totalTopics={summary.topics.length}
                                        />
                                    ))}
                                     {/* Message if topics array is empty or missing */} 
                                     {(!Array.isArray(summary.topics) || summary.topics.length === 0) && (
                                         <p className="text-muted-foreground text-sm">No key topics found in the summary.</p>
                                     )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VideoSummary;
