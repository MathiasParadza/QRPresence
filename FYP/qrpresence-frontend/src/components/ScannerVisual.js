import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/ScannerVisual.tsx
import { useRef, useEffect, useCallback } from 'react'; // Added useCallback import
export const ScannerVisual = ({ videoRef, scanning, torchOn }) => {
    const scannerLineRef = useRef(null);
    const scannerAnimationRef = useRef(0);
    const startScannerAnimation = useCallback(() => {
        let direction = 1;
        let position = 0;
        const animate = () => {
            if (!scannerLineRef.current)
                return;
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
        }
        else {
            stopScannerAnimation();
        }
        return () => stopScannerAnimation();
    }, [scanning, startScannerAnimation, stopScannerAnimation]);
    return (_jsxs("div", { style: styles.scannerContainer, children: [_jsx("video", { ref: videoRef, style: styles.video, playsInline: true, muted: true }), _jsx("div", { style: styles.scannerOverlay, children: _jsxs("div", { style: styles.scannerBox, children: [_jsx("div", { ref: scannerLineRef, style: styles.scannerLine }), _jsx("div", { style: { ...styles.corner, top: 0, left: 0, borderTop: '3px solid #4ade80', borderLeft: '3px solid #4ade80' } }), _jsx("div", { style: { ...styles.corner, top: 0, right: 0, borderTop: '3px solid #4ade80', borderRight: '3px solid #4ade80' } }), _jsx("div", { style: { ...styles.corner, bottom: 0, left: 0, borderBottom: '3px solid #4ade80', borderLeft: '3px solid #4ade80' } }), _jsx("div", { style: { ...styles.corner, bottom: 0, right: 0, borderBottom: '3px solid #4ade80', borderRight: '3px solid #4ade80' } })] }) })] }));
};
const styles = {
    scannerContainer: {
        position: 'relative',
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
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none'
    },
    scannerBox: {
        border: '2px solid rgba(74, 222, 128, 0.8)',
        borderRadius: '0.5rem',
        width: '256px',
        height: '256px',
        position: 'relative',
        overflow: 'hidden'
    },
    scannerLine: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        backgroundColor: 'rgba(74, 222, 128, 0.8)',
        transform: 'translateY(0)'
    },
    corner: {
        position: 'absolute',
        width: '32px',
        height: '32px'
    }
};
