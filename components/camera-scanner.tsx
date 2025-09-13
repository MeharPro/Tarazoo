'use client';

import { useEffect, useRef, useState } from 'react';
import type { Product } from '../packages/shared/types';
import { getProductByName } from 'lib/supabase';

interface CameraScannerProps {
  onDetected: (product: Product) => void;
  onClose: () => void;
  autoCloseOnScan?: boolean;
}

export default function CameraScanner({ onDetected, onClose, autoCloseOnScan = true }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualName, setManualName] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [autoMode, setAutoMode] = useState(false);
  const [showManual, setShowManual] = useState(false);

  useEffect(() => {
    startScanning();

    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setIsScanning(true);
      setError(null);

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await new Promise((resolve) => {
          videoRef.current!.onloadedmetadata = resolve;
        });
        
        // Check for torch support
        const track = stream.getVideoTracks()[0];
        if (track && 'getCapabilities' in track) {
          const capabilities = (track as any).getCapabilities();
          if (capabilities && 'torch' in capabilities) {
            setTorchEnabled(true);
          }
        }

        // Start periodic vision detection only if auto mode is enabled
        if (autoMode) startPeriodicDetection();
      }
    } catch (err) {
      console.error('Camera error:', err);
      const errorMessage = err instanceof Error && err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions and try again.'
        : err instanceof Error && err.name === 'NotFoundError'
        ? 'No camera found. Please connect a camera and try again.'
        : 'Unable to access camera. Please check permissions and try again.';
      setError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current as any);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  };

  const toggleTorch = async () => {
    if (streamRef.current && torchEnabled) {
      const track = streamRef.current.getVideoTracks()[0];
      if (!track) return;
      const capabilities = (track as any).getCapabilities && (track as any).getCapabilities();
      
      if (capabilities && 'torch' in capabilities) {
        const settings = (track as any).getSettings ? (track as any).getSettings() : {};
        const currentTorch = (settings as any).torch || false;
        await (track as any).applyConstraints({
          advanced: [{ torch: !currentTorch } as any]
        });
      }
    }
  };

  const startPeriodicDetection = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(async () => {
      try {
        const label = await detectCurrentFrame();
        if (!label) return;
        const product = await getProductByName(label);
        if (product) {
          if ('vibrate' in navigator) {
            navigator.vibrate(200);
          }
          stopScanning();
          onDetected(product);
          if (autoCloseOnScan) onClose();
        } else {
          setError(`Detected "${label}" but could not find a matching product.`);
          setTimeout(() => setError(null), 1500);
        }
      } catch (e) {
        // Swallow intermittent errors from detection
      }
    }, 1500);
  };

  const captureAndDetect = async () => {
    try {
      const label = await detectCurrentFrame();
      if (!label) {
        setError('Could not identify item. Try again.');
        setTimeout(() => setError(null), 1500);
        return;
      }
      const product = await getProductByName(label);
      if (product) {
        if ('vibrate' in navigator) navigator.vibrate(150);
        stopScanning();
        onDetected(product);
        if (autoCloseOnScan) onClose();
      } else {
        setError(`Detected "${label}" but no matching product found.`);
        setTimeout(() => setError(null), 1500);
      }
    } catch (e) {
      setError('Capture failed. Please try again.');
      setTimeout(() => setError(null), 1500);
    }
  };

  const detectCurrentFrame = async (): Promise<string | null> => {
    if (!videoRef.current) return null;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    // Square crop center for robustness
    const size = Math.min(video.videoWidth || 640, video.videoHeight || 640) || 640;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(
      video,
      (video.videoWidth - size) / 2,
      (video.videoHeight - size) / 2,
      size,
      size,
      0,
      0,
      size,
      size
    );
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const res = await fetch('/api/vision-detect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: dataUrl })
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.item || null;
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName) return;
    const product = await getProductByName(manualName.toLowerCase());
    if (product) {
      onDetected(product);
      if (autoCloseOnScan) onClose();
    } else {
      setError('No matching product found by name');
      setTimeout(() => setError(null), 1500);
    }
    setManualName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="relative flex-1">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/20 backdrop-blur rounded-full p-3 text-white"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {torchEnabled && (
          <button
            onClick={toggleTorch}
            className="absolute top-4 left-4 z-10 bg-white/20 backdrop-blur rounded-full p-3 text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>
        )}

        {/* Manual input toggle */}
        <button
          onClick={() => setShowManual((v) => !v)}
          className="absolute top-4 right-20 z-10 bg-white/20 backdrop-blur rounded-full px-3 py-2 text-white text-sm"
        >
          {showManual ? 'Hide Manual' : 'Manual'}
        </button>

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {/* Scanning overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="w-64 h-64 border-2 border-white rounded-lg">
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
            </div>
            {isScanning && autoMode && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-green-500 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* Controls: torch (left), auto toggle (next), shutter (bottom center in manual mode) */}
        <button
          onClick={() => {
            const next = !autoMode;
            setAutoMode(next);
            if (next) {
              startPeriodicDetection();
              setIsScanning(true);
            } else if (timerRef.current) {
              clearInterval(timerRef.current as any);
              timerRef.current = null;
              setIsScanning(false);
            }
          }}
          className="absolute top-4 left-20 z-10 bg-white/20 backdrop-blur rounded-full px-3 py-2 text-white text-sm"
        >
          {autoMode ? 'Auto: ON' : 'Auto: OFF'}
        </button>

        {!autoMode && (
          <div className="absolute bottom-10 left-0 right-0 flex items-center justify-center pointer-events-none">
            <button
              onClick={captureAndDetect}
              className="pointer-events-auto w-20 h-20 rounded-full border-4 border-white bg-white/70 active:bg-white/90 shadow-lg"
              aria-label="Capture"
            />
          </div>
        )}

        {error && (
          <div className="absolute bottom-20 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>
      {showManual && (
        <div className="bg-white p-4 border-t border-gray-200">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Enter item name (e.g., pen)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
