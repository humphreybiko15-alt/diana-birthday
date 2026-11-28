/**
 * React hook for story card generation and download
 */
import { useCallback, useState } from 'react';
import { generateStoryCard } from './storyCardGenerator.js';

export function useStoryCard() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const generateAndDownload = useCallback(async (params) => {
    setIsGenerating(true);
    
    try {
      // Generate canvas
      const canvas = generateStoryCard(params);
      
      // Convert to blob
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 1.0));
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `birthday-story-${params.recipientName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to generate story card:', error);
      return false;
    } finally {
      setIsGenerating(false);
    }
  }, []);
  
  const generateForPreview = useCallback((params) => {
    return generateStoryCard(params);
  }, []);
  
  return { generateAndDownload, generateForPreview, isGenerating };
}
