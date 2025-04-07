
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { SummaryResult, Topic, YouTubeVideoInfo } from '@/lib/types';

interface VideoSummaryProps {
  videoInfo: YouTubeVideoInfo | null;
  summary: SummaryResult | null;
}

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
                <h3 className="text-lg font-medium mb-2">TLDR</h3>
                <p className="text-muted-foreground">{summary.tldr}</p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Key Topics</h3>
                <Accordion type="multiple" className="w-full">
                  {summary.topics.map((topic, index) => (
                    <TopicAccordionItem key={index} topic={topic} index={index} />
                  ))}
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const TopicAccordionItem: React.FC<{ topic: Topic; index: number }> = ({ topic, index }) => {
  return (
    <AccordionItem value={`topic-${index}`}>
      <AccordionTrigger className="text-left">
        {topic.title}
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-4 space-y-4">
          <div>
            <h4 className="font-medium mb-2">Key Points</h4>
            <ul className="list-disc pl-5 space-y-1">
              {topic.keyPoints.map((point, i) => (
                <li key={i} className="text-muted-foreground">{point}</li>
              ))}
            </ul>
          </div>
          
          {topic.subtopics && topic.subtopics.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Subtopics</h4>
              <Accordion type="multiple" className="w-full">
                {topic.subtopics.map((subtopic, subIndex) => (
                  <TopicAccordionItem 
                    key={`${index}-${subIndex}`} 
                    topic={subtopic} 
                    index={subIndex} 
                  />
                ))}
              </Accordion>
            </div>
          )}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default VideoSummary;
