/* ═══════════════════════════════════════════════════════════════════════════════
   Story Card Canvas Generator — 9:16 Instagram/WhatsApp Story Card
   Pure HTML5 Canvas, zero dependencies, generates downloadable PNG
   ═════════════════════════════════════════════════════════════════════════════════════ */

import { useRef, useEffect } from 'react';
import { useStoryCard } from './useStoryCard.js';

/**
 * StoryCardPreview component for showing the card before download
 */
export function StoryCardPreview({ params, onClose, onDownload }) {
  const canvasRef = useRef(null);
  const { generateForPreview, generateAndDownload, isGenerating } = useStoryCard();
  
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = generateForPreview(params);
    const ctx = canvasRef.current.getContext('2d');

    // Logical (display) size of the generated card — generateStoryCard() sets
    // canvas.style.width/height to the logical width/height (e.g. 1080×1920).
    const cardW = parseFloat(canvas.style.width) || canvas.width;
    const cardH = parseFloat(canvas.style.height) || canvas.height;

    // Destination size = preview canvas intrinsic size (CSS width × height).
    const destW = ctx.canvas.width;
    const destH = ctx.canvas.height;

    // Fit the full card into the preview while preserving the 9:16 aspect
    // ratio (never distort/squish vertically).
    const cardRatio = cardW / cardH;
    let drawW = destW;
    let drawH = destW / cardRatio;
    if (drawH > destH) {
      drawH = destH;
      drawW = destH * cardRatio;
    }
    const offsetX = (destW - drawW) / 2;
    const offsetY = (destH - drawH) / 2;

    // Keep smoothing ON so the downscaled preview stays crisp instead of
    // blocky/nearest-neighbor.
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, cardW, cardH, offsetX, offsetY, drawW, drawH);
  }, [params, generateForPreview]);
  
  const handleDownload = () => {
    generateAndDownload(params).then(success => {
      if (success && onDownload) onDownload();
    });
  };
  
  // Responsive 9:16 preview (never exceeds viewport)
  const maxPreviewWidth = Math.min(420, window.innerWidth - 40);
  const previewWidth = maxPreviewWidth;
  const previewHeight = previewWidth * 16 / 9;
  
  const canvasStyle = {
    aspectRatio: 9 / 16,
    width: 'auto',
    height: 'auto',
    maxHeight: '60vh',
    maxWidth: '100%',
    margin: '0 auto',
    display: 'block',
  };
  
  return (
    <div className="story-card-modal-overlay" onClick={onClose}>
      <div className="story-card-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Story Card Preview">
        <div className="story-card-header">
          <h3>Your Story Card 📱</h3>
          <button className="story-card-close" onClick={onClose} aria-label="Close preview">✕</button>
        </div>
        
        <div className="story-card-preview-wrapper">
          <canvas 
            ref={canvasRef} 
            width={previewWidth * 2} 
            height={previewHeight * 2}
            style={canvasStyle}
          />
        </div>
        
        <div className="story-card-actions">
          <button 
            className="btn-primary" 
            onClick={handleDownload}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : '📥 Download Story Card'}
          </button>
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
        
        <p className="story-card-hint">
          Perfect for Instagram Stories, WhatsApp Status & more! 9:16 ratio ✨
        </p>
      </div>
    </div>
  );
}

export default StoryCardPreview;