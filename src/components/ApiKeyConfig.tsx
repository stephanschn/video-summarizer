
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react"; // Removed Chevron icons
import { ApiKeyConfig } from '@/lib/types';
import { saveApiKey, getApiKey, deleteApiKey, testApiConnection } from '@/lib/api-service';
// Removed cn import as it's no longer needed for collapse styling

interface ApiKeyConfigProps {
  onConfigChange: (hasValidConfig: boolean) => void;
}

const ApiKeyConfiguration: React.FC<ApiKeyConfigProps> = ({ onConfigChange }) => {
  const [provider, setProvider] = useState<'openai' | 'gemini'>('openai');
  const [apiKey, setApiKey] = useState('');
  const [storedConfig, setStoredConfig] = useState<ApiKeyConfig | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'failed'>('untested');

  // Removed isCollapsed state and collapseIfValid function

  useEffect(() => {
    const savedConfig = getApiKey();
    if (savedConfig) {
      setStoredConfig(savedConfig);
      setProvider(savedConfig.provider);
      setApiKey(''); // Don't show the actual key
      testConnection(savedConfig, true); // Test connection on load
    } else {
      onConfigChange(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load effect

  const testConnection = async (config: ApiKeyConfig, initialLoad = false) => {
    setIsTesting(true);
    setConnectionStatus('untested');
    let isConnected = false;
    try {
      isConnected = await testApiConnection(config);
      
      if (isConnected) {
        setConnectionStatus('success');
        if (!initialLoad) {
          toast.success(`Successfully connected to ${config.provider.toUpperCase()} API`);
        }
        onConfigChange(true);
      } else {
        setConnectionStatus('failed');
        // Only show error toast on explicit actions, not initial load potentially failing
        if (!initialLoad) {
            toast.error(`Failed to connect to ${config.provider.toUpperCase()} API`);
        }
        onConfigChange(false);
      }
    } catch (error) {
      setConnectionStatus('failed');
       if (!initialLoad) { 
        toast.error(`Error testing connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
       }
      onConfigChange(false);
    } finally {
      setIsTesting(false);
    }
    return isConnected;
  };

  const handleSave = async () => {
    if (!apiKey) {
      toast.error('Please enter an API key');
      return;
    }
    
    const config: ApiKeyConfig = { provider, apiKey };
    const isConnected = await testConnection(config);

    if (isConnected) {
      saveApiKey(config);
      setStoredConfig(config);
      setApiKey(''); // Clear input after successful save
      // onConfigChange(true) is called within testConnection
    }
    // If not connected, testConnection already handled onConfigChange(false) and toast
  };

  const handleDelete = () => {
    deleteApiKey();
    setStoredConfig(null);
    setApiKey('');
    setConnectionStatus('untested');
    onConfigChange(false);
  };

  return (
    // Removed overflow-hidden and collapse-related classes/logic from Card and CardHeader
    <Card className="w-full">
      <CardHeader>
        {/* Removed onClick and conditional rendering based on isCollapsed */} 
        <CardTitle>API Configuration</CardTitle>
        <CardDescription className="mt-1">
          Configure your AI provider API key. Stored securely in browser local storage.
        </CardDescription>
        {/* Removed collapsed status display from header */} 
      </CardHeader>

      {/* Content is now always rendered */} 
      <CardContent className="space-y-4 pt-4">
        {/* Provider Selection */} 
        <div className="space-y-2">
          <Label>Select AI Provider</Label>
          <RadioGroup 
            value={provider} 
            onValueChange={(value) => setProvider(value as 'openai' | 'gemini')}
            className="flex space-x-4"
            disabled={!!storedConfig || isTesting}
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

        {/* API Key Input or Status Display */} 
        {!storedConfig ? (
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="api-key"
                type="password"
                placeholder={`Enter your ${provider === 'openai' ? 'OpenAI' : 'Gemini'} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                disabled={isTesting}
              />
              <Button onClick={handleSave} disabled={!apiKey || isTesting}>
                {isTesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save & Test
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Stored API Key Status</Label>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md text-sm">
              <div className="flex items-center space-x-2">
                {connectionStatus === 'success' && <Check size={16} className="text-green-600" />}
                {connectionStatus === 'failed' && <X size={16} className="text-red-600" />}
                {isTesting && <Loader2 size={16} className="animate-spin" />}
                {!isTesting && connectionStatus !== 'success' && connectionStatus !== 'failed' && <span className="w-4 h-4"></span>}
                <span>{storedConfig.provider.toUpperCase()} API Key</span>
              </div>
              <div>
                {isTesting && <span className="text-muted-foreground">Testing...</span>}
                {!isTesting && connectionStatus === 'success' && <span className="text-green-600 font-medium">Connected</span>}
                {!isTesting && connectionStatus === 'failed' && <span className="text-red-600 font-medium">Connection Failed</span>}
                {!isTesting && connectionStatus === 'untested' && <span className="text-muted-foreground">Stored (Untested)</span>}
              </div>
            </div>
          </div>
        )}
      </CardContent>
        
      {/* Footer with buttons - rendered only when a key is stored */} 
      {storedConfig && (
        // Removed cn utility and conditional margin 
        <CardFooter className="flex justify-between border-t pt-4 mt-4"> 
          <Button 
            variant="outline" 
            onClick={() => testConnection(storedConfig)} 
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
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
