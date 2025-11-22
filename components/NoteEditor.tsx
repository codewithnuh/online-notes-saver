"use client";

import { useState, useEffect } from "react";
import { Save, FileText, Upload, X, File } from "lucide-react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import ReactMarkdown from "react-markdown";

interface NoteEditorProps {
  subjectId: string;
  onNoteAdded: () => void;
  onCancel: () => void;
  initialNote?: {
    id: string;
    title: string;
    content: string;
    fileUrl?: string;
    type: "markdown" | "pdf";
  };
}

export default function NoteEditor({ subjectId, onNoteAdded, onCancel, initialNote }: NoteEditorProps) {
  const [title, setTitle] = useState(initialNote?.title || "");
  const [content, setContent] = useState(initialNote?.content || "");
  const [isPreview, setIsPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleSave = async () => {
    if (!title) return;
    setIsUploading(true);

    try {
      // Create a promise that rejects after 10 seconds
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Request timed out")), 10000);
      });

      const savePromise = async () => {
        let fileUrl = initialNote?.fileUrl || "";
        let type = initialNote?.type || "markdown";

        if (file) {
          const storageRef = ref(storage, `notes/${subjectId}/${Date.now()}_${file.name}`);
          await uploadBytes(storageRef, file);
          fileUrl = await getDownloadURL(storageRef);
          type = "pdf";
        }

        if (initialNote) {
          // Update existing note
          await updateDoc(doc(db, "notes", initialNote.id), {
            title,
            content: type === "markdown" ? content : "",
            fileUrl,
            type,
            updatedAt: new Date(),
          });
        } else {
          // Create new note
          await addDoc(collection(db, "notes"), {
            title,
            content: type === "markdown" ? content : "",
            fileUrl,
            type,
            subjectId,
            createdAt: new Date(),
          });
        }
      };

      // Race the save operation against the timeout
      await Promise.race([savePromise(), timeoutPromise]);

      onNoteAdded();
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Failed to save note. Please try again. Check console for details.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Create New Note</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note Title"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xl font-bold text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
        />

        <div className="flex gap-4 border-b border-white/10 pb-2">
          <button
            onClick={() => {
              setIsPreview(false);
              setFile(null);
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              !isPreview && !file
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <FileText size={18} />
            Markdown
          </button>
          <button
            onClick={() => setIsPreview(true)}
            disabled={!!file}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              isPreview
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "text-gray-400 hover:text-white disabled:opacity-50"
            }`}
          >
            Preview
          </button>
          <label
            className={`flex cursor-pointer items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
              file
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Upload size={18} />
            Upload PDF
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setIsPreview(false);
                }
              }}
            />
          </label>
        </div>

        {file ? (
          <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <File className="h-8 w-8 text-red-400" />
            <div className="flex-1">
              <p className="font-medium text-white">{file.name}</p>
              <p className="text-sm text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={() => setFile(null)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        ) : isPreview ? (
          <div className="min-h-[300px] rounded-lg border border-white/10 bg-white/5 p-4 prose prose-invert max-w-none">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note in Markdown..."
            className="min-h-[300px] w-full rounded-lg border border-white/10 bg-white/5 p-4 font-mono text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
          />
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isUploading || (!content && !file) || !title}
            className="flex items-center gap-2 rounded-lg bg-yellow-400 px-6 py-2 font-semibold text-black disabled:opacity-50 hover:bg-yellow-500"
          >
            {isUploading ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} />
                Save Note
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
