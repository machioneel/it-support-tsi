import QRCode from 'qrcode';

/** TSI navy, taken from public/tsi_logo.svg. */
const BRAND_NAVY = '#05186E';
const LOGO_URL = '/tsi_logo.svg';

const CANVAS_W = 720;
const CANVAS_H = 880;
const QR_MARGIN = 40;
const QR_SIZE = CANVAS_W - QR_MARGIN * 2;

/** The page a scanner should land on. */
export function assetValidationUrl(assetTag: string, origin = window.location.origin) {
  return `${origin}/validate/${encodeURIComponent(assetTag)}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Same-origin assets only, so the canvas stays untainted and toDataURL works.
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal memuat gambar: ${src}`));
    img.src = src;
  });
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Draws the asset QR label onto `canvas`: QR code, TSI logo punched into the
 * middle, and the asset tag underneath.
 *
 * The logo covers part of the QR, so error correction is forced to 'H' (~30%
 * recoverable) — without that the code would stop scanning.
 */
export async function renderAssetBarcode(
  canvas: HTMLCanvasElement,
  assetTag: string,
  url: string
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  const qrDataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: 'H',
    margin: 1,
    width: QR_SIZE,
    color: { dark: BRAND_NAVY, light: '#FFFFFF' },
  });

  const qrImg = await loadImage(qrDataUrl);
  ctx.drawImage(qrImg, QR_MARGIN, QR_MARGIN, QR_SIZE, QR_SIZE);

  // Logo in the middle, on a white pad so the modules underneath stay readable.
  const centerX = CANVAS_W / 2;
  const centerY = QR_MARGIN + QR_SIZE / 2;
  const logoSize = Math.round(QR_SIZE * 0.2);
  const padding = 14;

  ctx.fillStyle = '#FFFFFF';
  roundedRect(
    ctx,
    centerX - logoSize / 2 - padding,
    centerY - logoSize / 2 - padding,
    logoSize + padding * 2,
    logoSize + padding * 2,
    18
  );
  ctx.fill();

  try {
    const logo = await loadImage(LOGO_URL);
    ctx.drawImage(logo, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
  } catch {
    // A missing logo must not cost us a usable barcode.
  }

  // Asset tag
  ctx.fillStyle = BRAND_NAVY;
  ctx.textAlign = 'center';
  ctx.font = 'bold 52px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
  ctx.fillText(assetTag, centerX, QR_MARGIN + QR_SIZE + 90);

  ctx.fillStyle = '#6B7280';
  ctx.font = '24px system-ui, -apple-system, Segoe UI, sans-serif';
  ctx.fillText('Scan untuk validasi aset', centerX, QR_MARGIN + QR_SIZE + 134);
}

/** Triggers a PNG download of whatever is currently on the canvas. */
export function downloadCanvasPng(canvas: HTMLCanvasElement, fileName: string) {
  const link = document.createElement('a');
  link.download = fileName;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
