export function relativeTime(iso: string): string {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diffSec = Math.max(0, Math.round((now - then) / 1000));
    if (diffSec < 60) return `${diffSec} second${diffSec === 1 ? '' : 's'} ago`;
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    const diffHr = Math.round(diffMin / 60);
    if (diffHr < 24) return `${diffHr} hour${diffHr === 1 ? '' : 's'} ago`;
    const diffDay = Math.round(diffHr / 24);
    if (diffDay < 30) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    const diffMon = Math.round(diffDay / 30);
    if (diffMon < 12) return `${diffMon} month${diffMon === 1 ? '' : 's'} ago`;
    const diffYr = Math.round(diffMon / 12);
    return `${diffYr} year${diffYr === 1 ? '' : 's'} ago`;
}
