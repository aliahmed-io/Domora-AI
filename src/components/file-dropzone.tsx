"use client";

import React, { useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  onFileSelected: (file: File) => Promise<void> | void;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export function FileDropzone({
  onFileSelected,
  accept = ".pdf,.jpg,.jpeg,.png,.webp",
  label = "Drop a PDF or image here, or browse",
  disabled = false,
}: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file || disabled) return;
    await onFileSelected(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDragging(false);
        await handleFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex items-center justify-center gap-3 border border-dashed px-4 py-4 text-xs transition-colors cursor-pointer",
        dragging
          ? "border-[#8C4A3D] bg-[#8C4A3D]/8 text-[#262824]"
          : "border-[#C5A88A] bg-[#F5EBDF]/60 text-[#5A5C56] hover:border-[#262824] hover:text-[#262824]",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <Upload className="h-4 w-4 shrink-0" />
      <span>{label}</span>
      <input
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={async (e) => {
          await handleFiles(e.target.files);
          e.target.value = "";
        }}
        className="hidden"
      />
    </label>
  );
}
