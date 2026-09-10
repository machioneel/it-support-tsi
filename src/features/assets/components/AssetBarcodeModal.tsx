import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, Printer, Loader2, ExternalLink } from 'lucide-react';
import { assetValidationUrl, renderAssetBarcode, downloadCanvasPng } from '@/features/assets/lib/assetBarcode';
import type { Asset } from '@/types/index';

interface AssetBarcodeModalProps {
  asset: Asset | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function AssetBarcodeModal({ asset, isOpen, onClose }: AssetBarcodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendering, setRendering] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const url = asset ? assetValidationUrl(asset.asset_tag) : '';

  useEffect(() => {
    if (!isOpen || !asset) return;

    let cancelled = false;
    setRendering(true);
    setError(null);

    // The canvas only exists once the modal has painted.
    const frame = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderAssetBarcode(canvas, asset.asset_tag, assetValidationUrl(asset.asset_tag))
        .catch((err) => {
          console.error(err);
          if (!cancelled) setError(err?.message || 'Gagal membuat barcode');
        })
        .finally(() => {
          if (!cancelled) setRendering(false);
        });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [isOpen, asset]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !asset) return null;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    downloadCanvasPng(canvas, `${asset.asset_tag}.png`);
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<title>${asset.asset_tag}</title>` +
      `<body style="margin:0;display:flex;align-items:center;justify-content:center;height:100vh">` +
      `<img src="${canvas.toDataURL('image/png')}" style="max-width:100%;max-height:100%" ` +
      `onload="window.print();window.close()">` +
      `</body>`
    );
    win.document.close();
  };

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={onClose}></div>

      <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-2xl w-full max-w-md relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-5 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Asset Barcode</h2>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 truncate">{asset.asset_name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="relative rounded-xl border border-gray-100 dark:border-gray-800 bg-white p-4">
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-xl">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              </div>
            )}
            {/* Rendered at 720x880 and scaled down for display; the PNG keeps full resolution. */}
            <canvas ref={canvasRef} className="w-full h-auto block" />
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Tujuan scan</div>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-mono text-blue-600 hover:text-blue-700 break-all flex items-start gap-1.5"
            >
              {url}
              <ExternalLink className="w-3 h-3 shrink-0 mt-0.5" />
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0 flex items-center justify-end gap-3">
          <button
            onClick={handlePrint}
            disabled={rendering || !!error}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={handleDownload}
            disabled={rendering || !!error}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PNG
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
