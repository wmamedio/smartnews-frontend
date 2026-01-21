"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, FileText, X } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FileDropzoneProps {
  onFilesAccepted: (files: File[]) => void;
  acceptedFiles?: File[];
  onRemoveFile?: (index: number) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileDropzone({
  onFilesAccepted,
  acceptedFiles = [],
  onRemoveFile,
  maxFiles = 1,
  disabled = false,
}: FileDropzoneProps) {
  const onDrop = useCallback(
    (files: File[]) => {
      onFilesAccepted(files);
    },
    [onFilesAccepted]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/xml": [".xml", ".opml"],
      "text/csv": [".csv"],
      "text/html": [".html"],
    },
    maxFiles,
    disabled,
  });

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragActive ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-xs text-muted-foreground">or click to browse (OPML, CSV, or HTML)</p>
            <p className="text-xs text-muted-foreground">Max file size: 5MB</p>
          </div>
        </div>
      </Card>

      {acceptedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          {acceptedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 rounded-md border bg-card"
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              {onRemoveFile && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onRemoveFile(index)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
