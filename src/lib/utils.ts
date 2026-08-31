import type { PriorityLevel, TicketStatus } from './types';

export const priorityShort = (p: PriorityLevel): string => p.split(' - ')[0];

export const priorityClasses: Record<PriorityLevel, string> = {
  'P1 - Critical': 'text-red-700 bg-red-50 border border-red-200',
  'P2 - High': 'text-orange-700 bg-orange-50 border border-orange-200',
  'P3 - Medium': 'text-blue-700 bg-blue-50 border border-blue-200',
  'P4 - Low': 'text-slate-600 bg-slate-50 border border-slate-200',
};

export const statusClasses: Record<TicketStatus, string> = {
  Open: 'text-slate-700 bg-slate-100 border border-slate-200',
  'In Progress': 'text-indigo-700 bg-indigo-50 border border-indigo-200',
  Pending: 'text-amber-700 bg-amber-50 border border-amber-200',
  Resolved: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  Closed: 'text-slate-500 bg-slate-50 border border-slate-200',
};

export const statusDotClasses: Record<TicketStatus, string> = {
  Open: 'bg-slate-400',
  'In Progress': 'bg-indigo-500',
  Pending: 'bg-amber-500',
  Resolved: 'bg-emerald-500',
  Closed: 'bg-slate-300',
};

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDuration(minutes: number | null): string {
  if (!minutes) return '-';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}j ${m}m` : `${h}j`;
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export async function compressImage(file: File, maxWidth = 1280, maxHeight = 1280, quality = 0.8): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round(height * maxWidth / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round(width * maxHeight / height);
            height = maxHeight;
          }
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
