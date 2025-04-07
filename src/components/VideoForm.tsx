
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { extractVideoId } from '@/lib/api-service';
import { toast } from 'sonner';

interface VideoFormProps {
  onVideoSubmit: (videoId: string) => void;
  isLoading: boolean;
}

const VideoForm: React.FC<VideoFormProps> = ({ onVideoSubmit, isLoading }) => {
  const [videoUrl, setVideoUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoUrl.trim()) {
      toast.error('Please enter a YouTube video URL');
      return;
    }
    
    const videoId = extractVideoId(videoUrl);
    
    if (!videoId) {
      toast.error('Invalid YouTube URL. Please enter a valid YouTube video URL.');
      return;
    }
    
    onVideoSubmit(videoId);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          placeholder="Enter YouTube video URL (e.g., https://www.youtube.com/watch?v=...)"
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Processing...' : 'Summarize'}
        </Button>
      </div>
    </form>
  );
};

export default VideoForm;
