/* ═══════════════════════════════════════════════════════════════════════════════
   Story Card Canvas Generator — 9:16 Instagram/WhatsApp Story Card
   Pure HTML5 Canvas, zero dependencies, generates downloadable PNG
   ═════════════════════════════════════════════════════════════════════════════════════ */

import { useRef, useCallback, useEffect, useState } from 'react';

/**
 * Generate a QR code pattern on canvas (simple version without external library)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to encode
 * @param {number} x - X position
 * @param {number} y - Y position
 * @param {number} size - QR code size in pixels
 */
function drawQRCode(ctx, text, x, y, size) {
  // Simple QR code placeholder - in production would use a real QR library
  // For now, draw a recognizable QR-like pattern
  const moduleSize = size / 25;
  
  // Generate deterministic pattern from text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash |= 0;
  }
  
  // Seed random for consistent pattern
  const seededRandom = (seed) => {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };
  
  // Draw finder patterns (three corners)
  const drawFinder = (fx, fy) => {
    ctx.fillStyle = '#0d0516';
    // Outer square
    ctx.fillRect(fx, fy, 7 * moduleSize, 7 * moduleSize);
    // Inner white
    ctx.fillStyle = '#fff1f5';
    ctx.fillRect(fx + moduleSize, fy + moduleSize, 5 * moduleSize, 5 * moduleSize);
    // Center dot
    ctx.fillStyle = '#0d0516';
    ctx.fillRect(fx + 2 * moduleSize, fy + 2 * moduleSize, 3 * moduleSize, 3 * moduleSize);
  };
  
  drawFinder(x, y);
  drawFinder(x + 18 * moduleSize, y);
  drawFinder(x, y + 18 * moduleSize);
  
  // Draw data pattern
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      // Skip finder pattern areas
      if ((row < 9 && col < 9) || (row < 9 && col > 16) || (row > 16 && col < 9)) continue;
      // Skip timing patterns
      if (row === 6 || col === 6) continue;
      
      const seed = hash + row * 25 + col;
      const val = seededRandom(seed);
      if (val > 0.5) {
        ctx.fillStyle = '#0d0516';
        ctx.fillRect(x + col * moduleSize, y + row * moduleSize, moduleSize, moduleSize);
      }
    }
  }
  
  // Add "SCAN ME" label
  ctx.fillStyle = '#d946ef';
  ctx.font = 'bold 12px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SCAN TO PLAY', x + size/2, y + size + 20);
}

/**
 * Draw the story card on canvas
 * @param {Object} params - Card parameters
 * @returns {HTMLCanvasElement} The canvas element
 */
export function generateStoryCard(params) {
  const {
    recipientName = 'Humph',
    score = 7,
    maxScore = 7,
    customMessage = '',
    shareUrl = window.location.origin + window.location.pathname,
    width = 1080,
    height = 1920
  } = params;
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // ─── Background Gradient ───
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, '#0d0516');
  gradient.addColorStop(0.3, '#1a0533');
  gradient.addColorStop(0.6, '#2d0a52');
  gradient.addColorStop(1, '#4c1d95');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  // ─── Decorative Elements ───
  // Top accent line
  const topGradient = ctx.createLinearGradient(0, 0, width, 0);
  topGradient.addColorStop(0, '#d946ef');
  topGradient.addColorStop(0.5, '#fbbf24');
  topGradient.addColorStop(1, '#7c3aed');
  ctx.fillStyle = topGradient;
  ctx.fillRect(0, 0, width, 4);
  
  // Bottom accent line
  const bottomGradient = ctx.createLinearGradient(0, height, width, height);
  bottomGradient.addColorStop(0, '#7c3aed');
  bottomGradient.addColorStop(0.5, '#fbbf24');
  bottomGradient.addColorStop(1, '#d946ef');
  ctx.fillStyle = bottomGradient;
  ctx.fillRect(0, height - 4, width, 4);
  
  // Floating particles (decorative)
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 30; i++) {
    const x = (i * 127 + 43) % width;
    const y = (i * 193 + 87) % height;
    const size = 2 + (i % 4);
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // ─── Top Section: Header ───
  const headerY = 120;
  
  // Birthday emoji
  ctx.font = '80px "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🎂', width / 2, headerY);
  
  // "Happy Birthday"
  ctx.fillStyle = '#fff1f5';
  ctx.font = 'bold 48px Pacifico, cursive';
  ctx.fillText('Happy Birthday,', width / 2, headerY + 70);
  
  // Recipient name
  const nameGradient = ctx.createLinearGradient(0, headerY + 70, 0, headerY + 150);
  nameGradient.addColorStop(0, '#fbbf24');
  nameGradient.addColorStop(0.5, '#d946ef');
  nameGradient.addColorStop(1, '#f43f5e');
  ctx.fillStyle = nameGradient;
  ctx.font = 'bold 72px Pacifico, cursive';
  ctx.fillText(recipientName, width / 2, headerY + 155);
  
  // Sparkle emoji
  ctx.font = '50px "Apple Color Emoji", "Noto Color Emoji", sans-serif';
  ctx.fillText('✨', width / 2, headerY + 210);
  
  // ─── Middle Section: Score Card ───
  const cardY = headerY + 260;
  const cardHeight = 480;
  const cardWidth = width - 120;
  const cardX = 60;
  const cardRadius = 32;
  
  // Card background (glass effect)
  const cardGradient = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
  cardGradient.addColorStop(0, 'rgba(255,255,255,0.12)');
  cardGradient.addColorStop(1, 'rgba(255,255,255,0.04)');
  ctx.fillStyle = cardGradient;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 2;
  
  // Rounded rect
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, cardRadius);
  ctx.fill();
  ctx.stroke();
  
  // Inner glow
  ctx.shadowColor = 'rgba(217,70,239,0.3)';
  ctx.shadowBlur = 30;
  ctx.strokeStyle = 'rgba(217,70,239,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(cardX + 2, cardY + 2, cardWidth - 4, cardHeight - 4, cardRadius - 2);
  ctx.stroke();
  ctx.shadowBlur = 0;
  
  // Score title
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 24px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MEMORY SEQUENCE SCORE', width / 2, cardY + 80);
  
  // Score circle
  const circleY = cardY + 170;
  const circleRadius = 100;
  
  // Background circle
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(width / 2, circleY, circleRadius, 0, Math.PI * 2);
  ctx.stroke();
  
  // Progress circle
  const progress = score / maxScore;
  const scoreGradient = ctx.createLinearGradient(0, circleY - circleRadius, 0, circleY + circleRadius);
  scoreGradient.addColorStop(0, '#fbbf24');
  scoreGradient.addColorStop(0.5, '#d946ef');
  scoreGradient.addColorStop(1, '#7c3aed');
  ctx.strokeStyle = scoreGradient;
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(width / 2, circleY, circleRadius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  
  // Score text
  ctx.fillStyle = '#fff1f5';
  ctx.font = 'bold 64px Outfit, sans-serif';
  ctx.fillText(`${score}`, width / 2, circleY + 22);
  
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.font = '24px Outfit, sans-serif';
  ctx.fillText(`out of ${maxScore}`, width / 2, circleY + 60);
  
  // Perfect score badge
  if (score === maxScore) {
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 20px Outfit, sans-serif';
    ctx.fillText('🏆 PERFECT SCORE! 🏆', width / 2, circleY + 100);
  }
  
  // Custom message
  if (customMessage) {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'italic 22px Outfit, sans-serif';
    ctx.textAlign = 'center';
    
    // Wrap text
    const maxWidth = cardWidth - 80;
    const words = customMessage.split(' ');
    let line = '';
    let lineY = cardY + cardHeight - 80;
    
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, width / 2, lineY);
        line = words[i] + ' ';
        lineY += 32;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, width / 2, lineY);
  }
  
  // ─── Bottom Section: QR Code & CTA ───
  const qrY = cardY + cardHeight + 60;
  const qrSize = 220;
  
  // QR Code background
  ctx.fillStyle = '#fff1f5';
  ctx.beginPath();
  ctx.roundRect(width / 2 - qrSize / 2 - 16, qrY - 16, qrSize + 32, qrSize + 32 + 50, 20);
  ctx.fill();
  
  // Draw QR code
  drawQRCode(ctx, shareUrl, width / 2 - qrSize / 2, qrY, qrSize);
  
  // CTA text
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '600 22px Outfit, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Scan to Play Your Own!', width / 2, qrY + qrSize + 70);
  
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.font = '18px Outfit, sans-serif';
  ctx.fillText('Made with 💜 — Share the Love', width / 2, qrY + qrSize + 100);
  
  // ─── Watermark ───
  ctx.fillStyle = 'rgba(217,70,239,0.3)';
  ctx.font = 'bold 18px Pacifico, cursive';
  ctx.textAlign = 'right';
  ctx.fillText('diana-birthday 💜', width - 40, height - 40);
  
  return canvas;
}

/**
 * React hook for story card generation and download
 */
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

/**
 * StoryCardPreview component for showing the card before download
 */
export function StoryCardPreview({ params, onClose, onDownload }) {
  const canvasRef = useRef(null);
  const { generateForPreview, generateAndDownload, isGenerating } = useStoryCard();
  
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = generateForPreview(params);
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(canvas, 0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  }, [params, generateForPreview]);
  
  const handleDownload = () => {
    generateAndDownload(params).then(success => {
      if (success && onDownload) onDownload();
    });
  };
  
  // 9:16 aspect ratio preview (smaller for screen)
  const previewWidth = Math.min(360, window.innerWidth - 40);
  const previewHeight = previewWidth * 16 / 9;
  
  return (
    <div className="story-card-modal-overlay" onClick={onClose}>
      <div className="story-card-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Story Card Preview">
        <div className="story-card-header">
          <h3>Your Story Card 📱</h3>
          <button className="story-card-close" onClick={onClose} aria-label="Close preview">✕</button>
        </div>
        
        <div className="story-card-preview" style={{ width: previewWidth, height: previewHeight }}>
          <canvas 
            ref={canvasRef} 
            width={previewWidth * 2} 
            height={previewHeight * 2}
            style={{ width: '100%', height: '100%' }}
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