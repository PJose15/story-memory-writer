const WORDS_PER_PAGE = 250;
const WORDS_PER_MINUTE = 200;

export function paginateText(text: string, wordsPerPage = WORDS_PER_PAGE): string[] {
  if (!text.trim()) return [];
  const words = text.split(/\s+/);
  const pages: string[] = [];
  for (let i = 0; i < words.length; i += wordsPerPage) {
    pages.push(words.slice(i, i + wordsPerPage).join(' '));
  }
  return pages;
}

export function estimateReadingTime(text: string): { minutes: number; display: string } {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
  const display = minutes < 60 ? `${minutes} min read` : `${Math.floor(minutes / 60)}h ${minutes % 60}m read`;
  return { minutes, display };
}

export function formatChapterForReading(title: string, content: string): string {
  return `${title}\n\n${content}`;
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
