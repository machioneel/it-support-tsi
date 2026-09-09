/** "Yayuk TSI" -> "YT". Used for the avatar chips that stand in for photos. */
export function initialsOf(name: string | null | undefined): string {
  if (!name) return '—';
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  return letters || '—';
}
