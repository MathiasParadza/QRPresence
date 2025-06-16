// src/components/ScannerVisual.tsx
import React, { useRef, useEffect, useCallback } from 'react';  // Added useCallback import
import { SCANNER_CONFIG } from '../utils/config';
interface ScannerVisualProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  scanning: boolean;
  torchOn: boolean;
}
export const ScannerVisual: React.FC<ScannerVisualProps> = ({ videoRef, scanning, torchOn }) => {
  const scannerLineRef = useRef<HTMLDivElement>(null);
  const scannerAnimationRef = useRef<number>(0);

  const startScannerAnimation = useCallback(() => {
    let direction = 1;
    let position = 0;
    
    const animate = () => {
      if (!scannerLineRef.current) return;
      
      position += direction * 2;
      if (position >= 256 || position <= 0) {
        direction *= -1;
      }
      
      scannerLineRef.current.style.transform = `translateY(${position}px)`;
      scannerAnimationRef.current = requestAnimationFrame(animate);
    };
    
    scannerAnimationRef.current = requestAnimationFrame(animate);
  }, []);

  const stopScannerAnimation = useCallback(() => {
    if (scannerAnimationRef.current) {
      cancelAnimationFrame(scannerAnimationRef.current);
    }
  }, []);

  useEffect(() => {
    if (scanning) {
      startScannerAnimation();
    } else {
      stopScannerAnimation();
    }
    return () => stopScannerAnimation();
  }, [scanning, startScannerAnimation, stopScannerAnimation]);

  return (
    <div style={styles.scannerContainer}>
      <video
        ref={videoRef}
        style={styles.video}
        playsInline
        muted
      />
      
      <div style={styles.scannerOverlay}>
        <div style={styles.scannerBox}>
          <div 
            ref={scannerLineRef}
            style={styles.scannerLine}
          />
          
          {/* Scanner corners */}
          <div style={{...styles.corner, top: 0, left: 0, borderTop: '3px solid #4ade80', borderLeft: '3px solid #4ade80'}} />
          <div style={{...styles.corner, top: 0, right: 0, borderTop: '3px solid #4ade80', borderRight: '3px solid #4ade80'}} />
          <div style={{...styles.corner, bottom: 0, left: 0, borderBottom: '3px solid #4ade80', borderLeft: '3px solid #4ade80'}} />
          <div style={{...styles.corner, bottom: 0, right: 0, borderBottom: '3px solid #4ade80', borderRight: '3px solid #4ade80'}} />
        </div>
      </div>
    </div>
  );
};

const styles = {
  scannerContainer: {
    position: 'relative' as const,
    width: '100%',
    maxWidth: '28rem',
    marginBottom: '1rem'
  },
  video: {
    width: '100%',
    height: '300px',
    borderRadius: '0.375rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    backgroundColor: '#000'
  },
  scannerOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none' as const
  },
  scannerBox: {
    border: '2px solid rgba(74, 222, 128, 0.8)',
    borderRadius: '0.5rem',
    width: '256px',
    height: '256px',
    position: 'relative' as const,
    overflow: 'hidden'
  },
  scannerLine: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    backgroundColor: 'rgba(74, 222, 128, 0.8)',
    transform: 'translateY(0)'
  },
  corner: {
    position: 'absolute' as const,
    width: '32px',
    height: '32px'
  }
};