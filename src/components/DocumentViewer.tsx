"use client";

interface Props {
  content: string | null;
  fileName: string | null;
  fallbackLabel?: string;
}

/**
 * Renders stored document content:
 *  - PDF data URL   → embedded <iframe> + download link
 *  - Other data URL → download link only (Word docs, etc.)
 *  - Plain text     → scrollable monospace block
 *  - null/empty     → "Not provided" placeholder
 */
export function DocumentViewer({ content, fileName, fallbackLabel = "Not provided" }: Props) {
  if (!content) {
    return <span className="italic text-gray-400 font-sans text-sm">{fallbackLabel}</span>;
  }

  if (content.startsWith("data:")) {
    const isPdf = content.startsWith("data:application/pdf");

    if (isPdf) {
      return (
        <div className="space-y-2">
          {fileName && <p className="text-xs text-gray-400 font-medium">{fileName}</p>}
          <iframe
            src={content}
            className="w-full rounded border border-gray-200"
            style={{ height: "420px" }}
            title={fileName ?? "Document"}
          />
          <a
            href={content}
            download={fileName ?? "document.pdf"}
            className="inline-flex items-center gap-1 text-xs text-cmu-red hover:underline font-medium"
          >
            ⬇ Download PDF
          </a>
        </div>
      );
    }

    // Word / other binary
    return (
      <div className="flex items-center gap-3 bg-white rounded-lg p-4 border border-gray-100">
        <span className="text-2xl">📎</span>
        <div>
          <p className="text-sm font-semibold text-gray-800">{fileName ?? "Document"}</p>
          <p className="text-xs text-gray-400 mb-1">Word documents can&apos;t be previewed in-browser.</p>
          <a
            href={content}
            download={fileName ?? "document.docx"}
            className="text-xs text-cmu-red hover:underline font-medium"
          >
            ⬇ Download document
          </a>
        </div>
      </div>
    );
  }

  // Plain text (pasted or .txt)
  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-white rounded-lg p-4 border border-gray-100 max-h-52 overflow-y-auto font-mono">
      {content}
    </p>
  );
}
