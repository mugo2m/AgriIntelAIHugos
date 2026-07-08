"use client";

import { useState } from "react";
import { Upload, File, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FileUpload() {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = async () => {
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData
        });

        const result = await response.json();

        if (result.success) {
          toast.success(`✅ Uploaded: ${file.name}`);
          setUploadedDocs(prev => [...prev, result]);
        } else {
          toast.error(`❌ Failed: ${file.name}`);
        }
      } catch (error) {
        toast.error(`❌ Error uploading ${file.name}`);
      }
    }

    setUploading(false);
    setFiles([]);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-xl border-2 border-emerald-200">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 text-emerald-600" />
        Upload Farming Documents
      </h3>

      {/* Drop zone */}
      <div className="border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center">
        <input
          type="file"
          multiple
          accept=".pdf,.docx,.xlsx,.csv,.pptx,.jpg,.png"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center gap-3"
        >
          <File className="w-12 h-12 text-emerald-500" />
          <span className="text-emerald-700 font-medium">
            Click to select or drag & drop
          </span>
          <span className="text-sm text-gray-500">
            PDF, Excel, Word, PowerPoint, Images (Max 50MB)
          </span>
        </label>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-emerald-50 rounded-lg">
              <span className="text-sm truncate">{file.name}</span>
              <button onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}

          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                Uploading...
              </span>
            ) : (
              `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
            )}
          </button>
        </div>
      )}

      {/* Uploaded documents */}
      {uploadedDocs.length > 0 && (
        <div className="mt-6">
          <h4 className="font-semibold mb-2">Uploaded & Processed:</h4>
          <div className="space-y-2">
            {uploadedDocs.map((doc, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded-lg text-sm">
                <span className="font-medium">{doc.file.name}</span>
                <span className="text-green-600 ml-2">
                  ✅ {doc.rag.chunksCount} chunks created
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}