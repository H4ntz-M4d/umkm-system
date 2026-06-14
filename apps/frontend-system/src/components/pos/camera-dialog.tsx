import { useEffect, useRef } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScanLine } from "lucide-react";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDetected: (code: string) => void;
};

export const CameraScannerDialog = ({
  open,
  onOpenChange,
  onDetected,
}: Props) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

useEffect(() => {
  if (!open) return;
  let cancelled = false;

  // 1. TETAP OPTIMALKAN ALGORITMA (TRY_HARDER)
  // Ini aman karena dijalankan di dalam library, tidak mengatur hardware kamera ke browser
  const hints = new Map();
  hints.set(DecodeHintType.TRY_HARDER, true); 
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.QR_CODE,
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.UPC_A
  ]);

  // Masukkan hints optimasi ke dalam reader
  const reader = new BrowserMultiFormatReader(hints);

  (async () => {
    try {
      // 2. KEMBALI KE CARA ASLI KAMU (100% Aman untuk Izin "Hanya kali ini")
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      const rear = devices.find((d) => /back|rear|environment/i.test(d.label));
      const deviceId = rear?.deviceId ?? devices[0]?.deviceId;
      
      if (!videoRef.current || cancelled) return;

      // Gunakan fungsi aslimu kembali
      controlsRef.current = await reader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, _err, controls) => {
          if (result && !cancelled) {
            controls.stop();
            onDetected(result.getText());
            onOpenChange(false);
          }
        },
      );
    } catch (err) {
      console.error("Camera scanner error:", err);
    }
  })();

  return () => {
    cancelled = true;
    controlsRef.current?.stop();
    controlsRef.current = null;
  };
}, [open, onDetected, onOpenChange]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <ScanLine className="h-5 w-5 text-primary" />
            Scan via Kamera
          </DialogTitle>

          <DialogDescription>
            Arahkan kamera ke barcode produk. Deteksi otomatis dan langsung
            masuk keranjang.
          </DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg border border-border bg-black aspect-video">
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            muted
            playsInline
          />

          <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-primary/80 shadow-[0_0_12px_hsl(var(--primary))]" />
        </div>

        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Tutup
        </Button>
      </DialogContent>
    </Dialog>
  );
};
