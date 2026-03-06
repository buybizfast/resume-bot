declare module 'html-to-docx' {
  function HTMLtoDOCX(
    html: string,
    headerHTMLString: string | null,
    options?: Record<string, unknown>
  ): Promise<Blob>;
  export default HTMLtoDOCX;
}
