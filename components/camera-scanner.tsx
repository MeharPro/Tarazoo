'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { Result, Exception } from '@zxing/library';
import { getProductByBarcode } from 'lib/supabase';
import type { Product } from '../packages/shared/types';

interface CameraScannerProps {
  onProductScanned: (product: Product) => void;
  onClose: () => void;
  autoCloseOnScan?: boolean;
}

export default function CameraScanner({ onProductScanned, onClose, autoCloseOnScan = true }: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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

      const codeReader = new BrowserMultiFormatReader();
      codeReaderRef.current = codeReader;

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
        
        // Check for torch support
        const track = stream.getVideoTracks()[0];
        if (track && (track as any).getCapabilities) {
          const capabilities = (track as any).getCapabilities();
          if (capabilities && 'torch' in capabilities) {
            setTorchEnabled(true);
          }
        }

        // Start continuous scanning
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, async (result: Result | undefined, err: Exception | undefined) => {
          if (result) {
            await handleBarcodeDetected(result.getText());
          }
          if (err && (err as any).name !== 'NotFoundException') {
            console.error('Scanning error:', err);
          }
        });
      }
    } catch (err) {
      console.error('Camera error:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      (codeReaderRef.current as any).stopContinuousDecode?.();
      (codeReaderRef.current as any).reset?.();
      codeReaderRef.current = null;
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

  const handleBarcodeDetected = async (barcode: string) => {
    // Stop decoding to prevent multiple reads
    if (codeReaderRef.current) {
      (codeReaderRef.current as any).stopContinuousDecode?.();
      (codeReaderRef.current as any).reset?.();
    }

    const product = await getProductByBarcode(barcode);

    if (product) {
      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(200);
      }
      // Stop camera and bubble up
      stopScanning();
      onProductScanned(product);
      if (autoCloseOnScan) {
        onClose();
      }
    } else {
      setError(`Product not found for barcode: ${barcode}`);
      // Optionally resume decoding after error display
      setTimeout(() => {
        setError(null);
        if (videoRef.current) {
          const reader = new BrowserMultiFormatReader();
          codeReaderRef.current = reader;
          reader.decodeFromVideoDevice(undefined, videoRef.current!, async (result: Result | undefined, err: Exception | undefined) => {
            if (result) {
              await handleBarcodeDetected(result.getText());
            }
          });
        }
      }, 2000);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualBarcode) {
      await handleBarcodeDetected(manualBarcode);
      setManualBarcode('');
    }
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
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-green-500 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="absolute bottom-20 left-4 right-4 bg-red-500/90 text-white p-3 rounded-lg">
            {error}
          </div>
        )}
      </div>

      {/* Manual barcode input fallback */}
      <div className="bg-white p-4">
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <input
            type="text"
            value={manualBarcode}
            onChange={(e) => setManualBarcode(e.target.value)}
            placeholder="Enter barcode manually"
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
    </div>
  );
}
