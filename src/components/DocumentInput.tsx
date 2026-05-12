"use client";

import { useState, useRef, useCallback } from "react";

type Mode = "paste" | "upload";

interface Props {
  textValue: string;
  /** (content, fileName | null) — content is plain text or a base64 data URL */
  onChange: (content: string, fileName: string | null) => void;
  placeholder?: string;
  label?: string; // used for aria / placeholder defaults
}

export function DocumentInput({ textValue, onChange, placeholder, label = "document" }: Props) {
  const [mode, setMode] = useState<Mode>("paste");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback((file: File) => {
    setFileName(file.name);
    const ext = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();
    if (ext === "txt") {
      reader.onload = e => onChange(e.target?.result as string, file.name);
      reader.readAsText(file);
    } else {
      // PDF / DOC / DOCX — base64 data URL for in-app viewing
      reader.onload = e => onChange(e.target?.result as string, file.name);
      reader.readAsDataURL(file);
    }
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  function clearFile() {
    setFileName(null);
    onChange("", null);
    if (fileRef.current) fileRef.current.value = "";
  }

  const ext = fileName?.split(".").pop()?.toLowerCase();
  const fileIcon = ext === "txt" ? "📄" : ext === "pdf" ? "📕" : "📎";
  const fileNote =
    ext === "txt" ? "Text extracted" :
    ext === "pdf" ? "PDF encoded — viewable in faculty dashboard" :
    "Document encoded — downloadable from faculty dashboard";

  const defaultPlaceholder = placeholder ?? `Paste your ${label} text here…`;

  return (
    <div className="space-y-2">
      {/* Mode toggle */}
      <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 w-fit">
        {(["paste", "upload"] as Mode[]).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setMode(m); clearFile(); }}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "paste" ? "Paste text" : "Upload file"}
          </button>
        ))}
      </div>

      {mode === "paste" ? (
        <textarea
          value={textValue}
          onChange={e => onChange(e.target.value, null)}
          rows={6}
          placeholder={defaultPlaceholder}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cmu-red focus:border-transparent resize-y font-mono"
        />
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !fileName && fileRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragging       ? "border-cmu-red bg-red-50" :
            fileName       ? "border-green-300 bg-green-50" :
            "border-gray-300 bg-gray-50 hover:border-cmu-red hover:bg-red-50 cursor-pointer"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            className="hidden"
            onChange={e => { if (e.target.files?.[0]) readFile(e.target.files[0]); }}
          />

          {fileName ? (
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl">{fileIcon}</span>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-800">{fileName}</p>
                <p className="text-xs text-gray-500">{fileNote}</p>
              </div>
              <button
                type="button"
                onClick={e => { e.stopPropagation(); clearFile(); }}
                className="ml-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs shrink-0"
              >
                ×
              </button>
            </div>
          ) : (
            <>
              <div className="text-3xl mb-2">⬆️</div>
              <p className="text-sm font-medium text-gray-700">Drag & drop your {label} here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse — .txt, .pdf, .doc, .docx</p>
              <p className="text-xs text-gray-300 mt-2">PDFs are embedded directly in the faculty dashboard.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
