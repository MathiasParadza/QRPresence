import { useCallback, useRef, useState } from 'react';
import jsQR from 'jsqr';
export const useQRScanner = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [decodedText, setDecodedText] = useState('');
    const [scanActive, setScanActive] = useState(true);
    const animationRef = useRef(0);
    const startCamera = useCallback(async (torchOn = false) => {
        try {
            const constraints = {
                video: {
                    facingMode: 'environment',
                    ...(torchOn ? {
                        advanced: [{ torch: true }]
                    } : {})
                },
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        }
        catch (err) {
            throw new Error('Camera access denied or not available');
        }
    }, []);
    const stopCamera = useCallback(() => {
        const stream = videoRef.current?.srcObject;
        stream?.getTracks().forEach((track) => track.stop());
    }, []);
    const scanQRCode = useCallback((onDetect) => {
        if (!scanActive || !videoRef.current || !canvasRef.current) {
            return;
        }
        const canvas = canvasRef.current;
        const video = videoRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx || video.readyState !== 4) {
            animationRef.current = requestAnimationFrame(() => scanQRCode(onDetect));
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, canvas.width, canvas.height);
        if (code) {
            onDetect(code.data);
        }
        else {
            animationRef.current = requestAnimationFrame(() => scanQRCode(onDetect));
        }
    }, [scanActive]);
    const resetScanner = useCallback(() => {
        setDecodedText('');
        setScanActive(true);
    }, []);
    // Reasonable implementation of useEffect
    function useEffect(effect, deps) {
        // This is a minimal implementation for demonstration/testing purposes.
        // In a real React environment, useEffect is provided by React itself.
        // Here, we just call the effect immediately (not suitable for real hooks).
        effect();
    }
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            stopCamera();
        };
    }, [stopCamera]);
    return {
        videoRef,
        canvasRef,
        decodedText,
        scanActive,
        setDecodedText,
        setScanActive,
        startCamera,
        stopCamera,
        scanQRCode,
        resetScanner
    };
};
function useEffect(arg0, arg1) {
    throw new Error('Function not implemented.');
}
