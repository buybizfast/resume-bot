/**
 * Strips markdown formatting and em dashes from AI-generated text.
 * Apply this to any user-visible text coming from Blotato/Perplexity API responses.
 */
export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1') // Remove **bold**
    .replace(/\*(.+?)\*/g, '$1')     // Remove *italic*
    .replace(/`(.+?)`/g, '$1')       // Remove `code`
    .replace(/#{1,6}\s*/g, '')        // Remove ### headings
    .replace(/\[\d+\]/g, '')         // Remove citation markers [1], [2], etc.
    .replace(/\u2014/g, '-')          // Replace em dash with hyphen
    .replace(/\u2013/g, '-')          // Replace en dash with hyphen
    .replace(/\u2018|\u2019/g, "'")   // Replace smart single quotes
    .replace(/\u201c|\u201d/g, '"')   // Replace smart double quotes
    .trim();
}
