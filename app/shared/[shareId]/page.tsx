"use client";

import { useState, useEffect, use } from "react";
import { FileText, File, ExternalLink, BookOpen } from "lucide-react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  type: "markdown" | "pdf";
  createdAt: any;
}

export default function SharedPage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Get the shared link document
        const shareDoc = await getDoc(doc(db, "shared_links", shareId));
        if (!shareDoc.exists()) {
          setError("Invalid or expired link");
          setLoading(false);
          return;
        }

        const { subjectId } = shareDoc.data();

        // 2. Fetch Subject Details
        const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
        if (subjectDoc.exists()) {
          setSubjectName(subjectDoc.data().name);
        }

        // 3. Fetch Notes
        const q = query(
          collection(db, "notes"),
          where("subjectId", "==", subjectId)
        );
        const querySnapshot = await getDocs(q);
        const fetchedNotes: Note[] = [];
        querySnapshot.forEach((doc) => {
          fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
        });
        fetchedNotes.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load content");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#0a0a0a] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-[#0a0a0a] text-white">
        <h1 className="text-2xl font-bold text-red-400">{error}</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6 text-white lg:p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 text-black">
                <BookOpen size={20} />
              </div>
              <h1 className="text-3xl font-bold">
                Nano<span className="text-yellow-400">Notes</span>
              </h1>
            </div>
            <p className="mt-2 text-gray-400">Shared Notes: {subjectName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Notes List */}
          <div className="space-y-4">
            {notes.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-gray-400">
                No notes available for this subject.
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedNote?.id === note.id
                      ? "border-yellow-400 bg-yellow-400/5"
                      : "border-white/10 bg-[#0f0f0f] hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {note.type === "pdf" ? (
                      <File className="h-10 w-10 text-red-400" />
                    ) : (
                      <FileText className="h-10 w-10 text-yellow-400" />
                    )}
                    <div>
                      <h4 className="font-bold text-white">{note.title}</h4>
                      <p className="text-xs text-gray-400">
                        {new Date(note.createdAt?.seconds * 1000).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Note Preview */}
          <div className="sticky top-6 h-[calc(100vh-100px)] overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f]">
            {selectedNote ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-white/10 bg-white/5 p-4">
                  <h3 className="text-xl font-bold text-white">
                    {selectedNote.title}
                  </h3>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  {selectedNote.type === "pdf" ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <File className="mb-4 h-16 w-16 text-red-400" />
                      <p className="mb-4 text-gray-400">
                        PDF Preview not available
                      </p>
                      <a
                        href={selectedNote.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20"
                      >
                        <ExternalLink size={18} />
                        Download / Open PDF
                      </a>
                    </div>
                  ) : (
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{selectedNote.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-gray-500">
                Select a note to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
