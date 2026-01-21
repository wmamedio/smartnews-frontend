"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkUrlInput } from "@/components/content/import/BulkUrlInput";
import { FileDropzone } from "@/components/content/import/FileDropzone";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { feedSourcesService } from "@/lib/api/services/feed-sources.service";
import { toast } from "sonner";

export default function ContentImportPage() {
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { data: sources } = useQuery({
    queryKey: ["feed-sources"],
    queryFn: () => feedSourcesService.getAll(),
  });

  const uploadOPMLMutation = useMutation({
    mutationFn: async (file: File) => {
      toast.info("OPML upload coming soon - backend endpoint not available yet");
      throw new Error("Not implemented");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["feed-sources"] });
      toast.success("Successfully imported feed sources");
      setSelectedFiles([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload file");
    },
  });

  const handleFilesAccepted = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadOPMLMutation.mutate(selectedFiles[0]);
    }
  };

  const defaultSource = sources?.[0];

  return (
    <>
      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 lg:p-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Import Content</h2>
          <p className="text-muted-foreground">Bulk import content from files or URLs</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Import from File</CardTitle>
              <CardDescription>Upload OPML, CSV, or HTML bookmark files</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileDropzone
                onFilesAccepted={handleFilesAccepted}
                acceptedFiles={selectedFiles}
                onRemoveFile={(index) => {
                  setSelectedFiles((files) => files.filter((_, i) => i !== index));
                }}
                disabled={uploadOPMLMutation.isPending}
              />
              {selectedFiles.length > 0 && (
                <Button
                  onClick={handleUpload}
                  disabled={uploadOPMLMutation.isPending}
                  className="w-full"
                >
                  {uploadOPMLMutation.isPending ? "Uploading..." : "Upload & Import"}
                </Button>
              )}
            </CardContent>
          </Card>

          {defaultSource && (
            <BulkUrlInput
              feedSourceId={defaultSource.id}
              onSuccess={() => toast.success("URLs imported successfully")}
            />
          )}

          {!defaultSource && (
            <Card>
              <CardHeader>
                <CardTitle>Bulk URL Import</CardTitle>
                <CardDescription>Please create a feed source first to import URLs</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Go to the Sources page to create your first feed source.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
