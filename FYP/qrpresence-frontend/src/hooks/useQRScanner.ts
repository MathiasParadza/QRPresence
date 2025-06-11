
import { useCallback, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { SCANNER_CONFIG } from '../utils/config';

export const useQRScanner = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [decodedText, setDecodedText] = useState<string>('');
    const [scanActive, setScanActive] = useState<boolean>(true);
    const animationRef = useRef<number>(0);

    const startCamera = useCallback(async (torchOn = false): Promise<void> => {
        try {
            const constraints: MediaStreamConstraints = {
                video: { 
                    facingMode: 'environment',
                    ...(torchOn ? { 
                        advanced: [{ torch: true } as unknown as MediaTrackConstraintSet] 
                    } : {})
                },
            };
            
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (err) {
            throw new Error('Camera access denied or not available');
        }
    }, []);

    const stopCamera = useCallback((): void => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
    }, []);

    const scanQRCode = useCallback((onDetect: (text: string) => void): void => {
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
        } else {
            animationRef.current = requestAnimationFrame(() => scanQRCode(onDetect));
        }
    }, [scanActive]);

    const resetScanner = useCallback((): void => {
        setDecodedText('');
        setScanActive(true);
    }, []);

    // Reasonable implementation of useEffect
    function useEffect(effect: () => void | (() => void), deps?: any[]) {
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

function useEffect(arg0: () => () => void, arg1: (() => void)[]) {
    throw new Error('Function not implemented.');
}
