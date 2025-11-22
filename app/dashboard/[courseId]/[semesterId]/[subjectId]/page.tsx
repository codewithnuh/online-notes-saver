"use client";

import { useState, useEffect, use } from "react";
import { Plus, FileText, File, ArrowLeft, ExternalLink, Share2, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import NoteEditor from "@/components/NoteEditor";
import ReactMarkdown from "react-markdown";

interface Note {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  type: "markdown" | "pdf";
  createdAt: any;
}

export default function SubjectPage({ params }: { params: Promise<{ courseId: string; semesterId: string; subjectId: string }> }) {
  const { courseId, semesterId, subjectId } = use(params);
  const [notes, setNotes] = useState<Note[]>([]);
  const [subjectName, setSubjectName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [shareUrl, setShareUrl] = useState("");

  const fetchData = async () => {
    try {
      // Fetch Subject Details
      const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
      if (subjectDoc.exists()) {
        setSubjectName(subjectDoc.data().name);
      }

      // Fetch Notes
      const q = query(
        collection(db, "notes"),
        where("subjectId", "==", subjectId)
      );
      const querySnapshot = await getDocs(q);
      const fetchedNotes: Note[] = [];
      querySnapshot.forEach((doc) => {
        fetchedNotes.push({ id: doc.id, ...doc.data() } as Note);
      });
      // Sort by createdAt desc
      fetchedNotes.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subjectId]);

  const handleShare = async () => {
    try {
      // Create a share link
      const docRef = await addDoc(collection(db, "shared_links"), {
        subjectId,
        createdAt: new Date(),
      });
      const url = `${window.location.origin}/shared/${docRef.id}`;
      setShareUrl(url);
      navigator.clipboard.writeText(url);
      alert("Link copied to clipboard!");
    } catch (error) {
      console.error("Error creating share link:", error);
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      await deleteDoc(doc(db, "notes", noteId));
      setNotes(notes.filter(n => n.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const handleEditNote = (note: Note, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingNote(note);
    setIsCreating(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/${courseId}/${semesterId}`}
            className="rounded-full bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-3xl font-bold text-white">{subjectName}</h2>
            <p className="text-gray-400">Manage your notes</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10"
          >
            <Share2 size={20} />
            Share
          </button>
          <button
            onClick={() => {
              setEditingNote(null);
              setIsCreating(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black transition-transform hover:scale-105"
          >
            <Plus size={20} />
            Add Note
          </button>
        </div>
      </div>

      {isCreating ? (
        <NoteEditor
          subjectId={subjectId}
          initialNote={editingNote || undefined}
          onNoteAdded={() => {
            setIsCreating(false);
            setEditingNote(null);
            fetchData();
          }}
          onCancel={() => {
            setIsCreating(false);
            setEditingNote(null);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Notes List */}
          <div className="space-y-4">
            {loading ? (
              [1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-xl bg-white/5"
                />
              ))
            ) : notes.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
                <FileText className="mb-4 h-12 w-12 text-gray-600" />
                <h3 className="text-xl font-semibold text-white">No notes yet</h3>
                <p className="text-gray-400">
                  Create a markdown note or upload a PDF
                </p>
              </div>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => setSelectedNote(note)}
                  className={`group cursor-pointer rounded-xl border p-4 transition-all ${
                    selectedNote?.id === note.id
                      ? "border-yellow-400 bg-yellow-400/5"
                      : "border-white/10 bg-[#0f0f0f] hover:border-white/20 hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
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
                    
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEditNote(note, e)}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteNote(note.id, e)}
                        className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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
                <div className="border-b border-white/10 bg-white/5 p-4 flex justify-between items-center">
                  <h3 className="text-xl font-bold text-white">
                    {selectedNote.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => handleEditNote(selectedNote, e)}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Edit Note"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteNote(selectedNote.id, e)}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      title="Delete Note"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-6">
                  {selectedNote.type === "pdf" ? (
                    <div className="flex h-full flex-col items-center justify-center text-center">
                      <File className="mb-4 h-16 w-16 text-red-400" />
                      <p className="mb-4 text-gray-400">
                        PDF Preview not available in this view
                      </p>
                      <a
                        href={selectedNote.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 font-medium text-white hover:bg-white/20"
                      >
                        <ExternalLink size={18} />
                        Open PDF
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
      )}
    </div>
  );
}
