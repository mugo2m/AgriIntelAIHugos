import { FileUpload } from "@/components/FileUpload";

export default function UploadPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📚 Knowledge Base Manager</h1>
      <FileUpload />

      <div className="mt-8 p-4 bg-blue-50 rounded-xl">
        <h3 className="font-semibold mb-2">ℹ️ How it works:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Upload PDFs, Excel, Word, PowerPoint, or images</li>
          <li>Files are stored in Supabase Storage</li>
          <li>Automatically chunked and embedded into RAG knowledge base</li>
          <li>Available for both recommendations and Q&A instantly</li>
        </ul>
      </div>
    </div>
  );
}