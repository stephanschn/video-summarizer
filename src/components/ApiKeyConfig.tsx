
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { ApiKeyConfig } from '@/lib/types';
import { saveApiKey, getApiKey, deleteApiKey, testApiConnection } from '@/lib/api-service';

interface ApiKeyConfigProps {
  onConfigChange: (hasValidConfig: boolean) => void;
}

const ApiKeyConfiguration: React.FC<ApiKeyConfigProps> = ({ onConfigChange }) => {
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [storedConfig, setStoredConfig] = useState<ApiKeyConfig | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>('untested');

  useEffect(() => {
    const savedConfig = getApiKey();
    if (savedConfig) {
      setStoredConfig(savedConfig);
      setProvider(savedConfig.provider);
      setApiKey(''); // Don't show the actual key for security
      
      // Test the connection automatically when component mounts
      testConnection(savedConfig);
    }
  }, []);

  const testConnection = async (config: ApiKeyConfig) => {
    setIsTesting(true);
    setConnectionStatus('untested');
    
    try {
      const isConnected = await testApiConnection(config);
      
      if (isConnected) {
        setConnectionStatus('success');
        toast.success(`Successfully connected to ${config.provider.toUpperCase()} API`);
        onConfigChange(true);
      } else {
        setConnectionStatus('failed');
        toast.error(`Failed to connect to ${config.provider.toUpperCase()} API`);
        onConfigChange(false);
      }
    } catch (error) {
      setConnectionStatus('failed');
      toast.error(`Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      onConfigChange(false);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }
    
    const config: ApiKeyConfig = { provider, apiKey };
    saveApiKey(config);
    setStoredConfig(config);
    testConnection(config);
  };

  const handleDelete = () => {
    deleteApiKey();
    setStoredConfig(null);
    setApiKey('');
    setConnectionStatus('untested');
    onConfigChange(false);
  };

  const handleTestStoredKey = () => {
    if (storedConfig) {
      testConnection(storedConfig);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>API Configuration</CardTitle>
        <CardDescription>
          Configure your AI provider API key for video summarization. API keys are stored only in your browser's localStorage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Select AI Provider</Label>
          <RadioGroup 
            value={provider} 
            onValueChange={(value) => setProvider(value as 'openai' | 'gemini')}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="openai" id="openai" />
              <Label htmlFor="openai">OpenAI</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="gemini" id="gemini" />
              <Label htmlFor="gemini">Google Gemini</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <div className="flex space-x-2">
            <Input
              id="api-key"
              type="password"
              placeholder={storedConfig ? "••••••••••••••••••••••" : "Enter your API key"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <Button onClick={handleSave} disabled={!apiKey}>Save</Button>
          </div>
          
          {storedConfig && (
            <div className="flex items-center mt-2 text-sm">
              <div className="flex-1">
                {connectionStatus === 'success' && (
                  <div className="flex items-center text-green-600">
                    <Check size={16} className="mr-1" />
                    Connected to {storedConfig.provider.toUpperCase()} API
                  </div>
                )}
                {connectionStatus === 'failed' && (
                  <div className="flex items-center text-red-600">
                    <X size={16} className="mr-1" />
                    Connection failed
                  </div>
                )}
                {connectionStatus === 'untested' && (
                  <div className="text-muted-foreground">
                    {storedConfig.provider.toUpperCase()} API key stored
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      {storedConfig && (
        <CardFooter className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={handleTestStoredKey} 
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing
              </>
            ) : 'Test Connection'}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isTesting}
          >
            Remove API Key
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ApiKeyConfiguration;
