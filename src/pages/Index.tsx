
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { ReactFlowProvider } from "@xyflow/react";

import ApiKeyConfiguration from '@/components/ApiKeyConfig';
import VideoForm from '@/components/VideoForm';
import VideoSummary from '@/components/VideoSummary';
import MindMap from '@/components/MindMap';

import { fetchVideoDetails, generateSummary, getApiKey } from '@/lib/api-service';
import { SummaryResult, YouTubeVideoInfo } from '@/lib/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [hasValidConfig, setHasValidConfig] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  
  useEffect(() => {
    // Check if there's an existing API key on component mount
    const apiConfig = getApiKey();
    setHasValidConfig(!!apiConfig);
  }, []);

  const handleVideoSubmit = async (videoId: string) => {
    const apiConfig = getApiKey();
    
    if (!apiConfig) {
      toast.error("Please configure and save an API key first");
      return;
    }
    
    if (!hasValidConfig) {
      toast.error("Your API configuration is invalid. Please test the connection first.");
      return;
    }
    
    setIsLoading(true);
    setVideoInfo(null);
    setSummary(null);
    
    try {
      // Fetch video details
      const details = await fetchVideoDetails(videoId);
      setVideoInfo(details);
      
      // Generate summary
      const summaryResult = await generateSummary(videoId, apiConfig);
      setSummary(summaryResult);
      
      toast.success("Summary generated successfully!");
    } catch (error) {
      toast.error(`Error: ${error instanceof Error ? error.message : 'Failed to process video'}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight">YouTube Video Summarizer</h1>
        <p className="text-muted-foreground mt-2">
          Get a concise summary, key topics, and visual mind map of any YouTube video
        </p>
      </div>
      
      <div className="space-y-8">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-start gap-3">
          <ShieldCheck className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-800">Your API Keys Are Secure</h3>
            <p className="text-blue-700 text-sm">
              All API keys are stored <strong>only</strong> in your browser's localStorage and never sent to our servers. 
              Keys are used directly from your browser to communicate with the AI provider you select.
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">API Configuration</h2>
            <ApiKeyConfiguration onConfigChange={setHasValidConfig} />
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Video URL</h2>
            <VideoForm onVideoSubmit={handleVideoSubmit} isLoading={isLoading} />
            
            {isLoading && (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Processing video...</span>
              </div>
            )}
          </div>
        </div>
        
        <Separator />
        
        {summary && videoInfo && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="summary">Text Summary</TabsTrigger>
              <TabsTrigger value="mindmap">Mind Map</TabsTrigger>
            </TabsList>
            
            <TabsContent value="summary">
              <VideoSummary videoInfo={videoInfo} summary={summary} />
            </TabsContent>
            
            <TabsContent value="mindmap">
              <ReactFlowProvider>
                <MindMap summary={summary} />
              </ReactFlowProvider>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default Index;
