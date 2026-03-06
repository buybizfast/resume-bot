/**
 * Triggers a file download in the browser by creating a temporary anchor
 * element, clicking it, and cleaning up.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Converts resume HTML to a DOCX file and triggers a browser download.
 * Sends the HTML to a server-side API route that performs the conversion,
 * since html-to-docx requires Node.js APIs (fs, crypto) not available in
 * the browser.
 */
export async function exportToDocx(
  html: string,
  filename: string
): Promise<void> {
  const response = await fetch('/api/export-docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ html, filename }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate DOCX file');
  }

  const blob = await response.blob();
  triggerDownload(blob, filename);
}

/**
 * Creates a plain-text file from the provided string and triggers a browser
 * download.
 */
export function exportToPlainText(
  plainText: string,
  filename: string
): void {
  const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Exports the resume as a PDF by invoking the browser's native print dialog.
 */
export function exportToPDF(): void {
  window.print();
}
