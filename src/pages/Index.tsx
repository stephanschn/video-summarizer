
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2, Settings } from "lucide-react";
import { toast } from "sonner";
import { ReactFlowProvider } from "@xyflow/react";
import { Button } from "@/components/ui/button";

import ApiKeyConfiguration from '@/components/ApiKeyConfig';
import VideoForm from '@/components/VideoForm';
import VideoSummary from '@/components/VideoSummary';
import MindMap from '@/components/MindMap';

import { fetchVideoDetails, generateSummary, getApiKey, testApiConnection } from '@/lib/api-service';
import { SummaryResult, YouTubeVideoInfo } from '@/lib/types';

const Index = () => {
  const [activeTab, setActiveTab] = useState<string>("summary");
  const [hasValidConfig, setHasValidConfig] = useState<boolean>(false);
  const [showApiConfig, setShowApiConfig] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [summary, setSummary] = useState<SummaryResult | null>(null);
  
  useEffect(() => {
    const apiConfig = getApiKey();
    const isValid = !!apiConfig;
    setHasValidConfig(isValid);
    setShowApiConfig(!isValid); // Show if not valid on load
  }, []);

  const handleConfigChange = (isValid: boolean) => {
    setHasValidConfig(isValid);
    // Don't automatically hide here anymore - let user toggle manually
    // if (isValid) {
    //   setShowApiConfig(false);
    // }
    // If config becomes invalid (e.g., key removed), ensure the form is shown
    if (!isValid) {
        setShowApiConfig(true);
    }
  };

  const handleVideoSubmit = async (videoId: string) => {
    const apiConfig = getApiKey();
    
    if (!apiConfig || !hasValidConfig) { // Check hasValidConfig directly
      toast.error("Please configure and save a valid API key first");
      setShowApiConfig(true); 
      
      // Test connection again if config exists but validation state is false
      if(apiConfig && !hasValidConfig) {
          const isValid = await testApiConnection(apiConfig);
          if (!isValid) {
               toast.error("API key connection failed. Please check your key.");
          } 
          setHasValidConfig(isValid);
      }
      return;
    }
    
    setIsLoading(true);
    setVideoInfo(null);
    setSummary(null);
    
    try {
      const details = await fetchVideoDetails(videoId);
      setVideoInfo(details);
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
        <h1 className="text-3xl font-bold tracking-tight">YouTube Summarizer</h1>
        <p className="text-muted-foreground mt-2">
          Get a concise summary, key topics, and visual mind map of any YouTube video
        </p>
      </div>
      
      <div className="space-y-8">
        <div className="grid gap-6 md:grid-cols-2">
           {/* Video URL Section - Conditional */} 
          {hasValidConfig && ( 
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
          )}

          <div className="space-y-4">
             {/* API Config Header + Toggle */} 
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold">API Configuration</h2>
              {hasValidConfig && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowApiConfig(!showApiConfig)} 
                  aria-label="Toggle API Configuration"
                  className="text-muted-foreground hover:text-foreground h-8 w-8"
                >
                  <Settings className="h-6 w-6" />
                </Button>
              )}
            </div>
             {/* Conditionally render the ApiKeyConfiguration component */} 
            {(showApiConfig || !hasValidConfig) && (
              <ApiKeyConfiguration onConfigChange={handleConfigChange} />
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Results Section - Conditional on Summary & Video Info */} 
        {summary && videoInfo && hasValidConfig && (
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
