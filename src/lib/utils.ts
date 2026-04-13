/**
 * Strips HTML tags from a string.
 */
export function stripHtml(html: string): string {
    if (!html) return '';
    // This is a simple regex-based strip for server-side/client-side use
    return html.replace(/<[^>]*>?/gm, '');
}

/**
 * Formats a date string to a consistent format.
 */
export function formatDate(dateStr: string | Date): string {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}
