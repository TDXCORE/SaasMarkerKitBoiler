'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';

interface QRCodeDisplayProps {
  qrCode: string;
}

export function QRCodeDisplay({ qrCode }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (qrCode && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrCode, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).catch(console.error);
    }
  }, [qrCode]);

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Scan QR Code</CardTitle>
        <CardDescription>
          Open WhatsApp on your phone and scan this QR code to connect
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <canvas 
          ref={canvasRef}
          className="border rounded-lg"
        />
      </CardContent>
    </Card>
  );
}
