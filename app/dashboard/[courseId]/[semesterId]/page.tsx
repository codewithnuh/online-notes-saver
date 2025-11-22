"use client";

import { useState, useEffect, use } from "react";
import { Plus, BookOpen, ArrowLeft, ArrowRight, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  code: string;
  semesterId: string;
}

export default function SemesterPage({ params }: { params: Promise<{ courseId: string; semesterId: string }> }) {
  const { courseId, semesterId } = use(params);
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesterName, setSemesterName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCode, setNewSubjectCode] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Semester Details
        const semesterDoc = await getDoc(doc(db, "semesters", semesterId));
        if (semesterDoc.exists()) {
          setSemesterName(semesterDoc.data().name);
        }

        // Fetch Subjects
        const q = query(
          collection(db, "subjects"),
          where("semesterId", "==", semesterId)
        );
        const querySnapshot = await getDocs(q);
        const fetchedSubjects: Subject[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSubjects.push({ id: doc.id, ...doc.data() } as Subject);
        });
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [semesterId]);

  const handleCreateOrUpdateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName || !newSubjectCode) return;

    try {
      if (editingSubject) {
        // Update existing subject
        await updateDoc(doc(db, "subjects", editingSubject.id), {
          name: newSubjectName,
          code: newSubjectCode,
        });

        setSubjects(subjects.map(s => 
          s.id === editingSubject.id 
            ? { ...s, name: newSubjectName, code: newSubjectCode } 
            : s
        ));
      } else {
        // Create new subject
        const docRef = await addDoc(collection(db, "subjects"), {
          name: newSubjectName,
          code: newSubjectCode,
          semesterId,
          createdAt: new Date(),
        });

        setSubjects([
          ...subjects,
          { id: docRef.id, name: newSubjectName, code: newSubjectCode, semesterId },
        ]);
      }
      
      closeModal();
    } catch (error) {
      console.error("Error saving subject:", error);
    }
  };

  const handleDeleteSubject = async (subjectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      await deleteDoc(doc(db, "subjects", subjectId));
      setSubjects(subjects.filter(s => s.id !== subjectId));
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const openEditModal = (subject: Subject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSubject(subject);
    setNewSubjectName(subject.name);
    setNewSubjectCode(subject.code);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
    setNewSubjectName("");
    setNewSubjectCode("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/${courseId}`}
          className="rounded-full bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white">{semesterName}</h2>
          <p className="text-gray-400">Select a subject</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black transition-transform hover:scale-105"
        >
          <Plus size={20} />
          Add Subject
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : subjects.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
          <BookOpen className="mb-4 h-12 w-12 text-gray-600" />
          <h3 className="text-xl font-semibold text-white">No subjects yet</h3>
          <p className="text-gray-400">
            Add a subject to start adding notes
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => (
            <Link
              key={subject.id}
              href={`/dashboard/${courseId}/${semesterId}/${subject.id}`}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 transition-all hover:border-yellow-400/50 hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-400/10 text-blue-400 group-hover:bg-blue-400 group-hover:text-black transition-colors">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{subject.name}</h3>
                  <p className="text-sm text-gray-400">{subject.code}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEditModal(subject, e)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSubject(subject.id, e)}
                    className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <ArrowRight size={20} className="text-gray-600 transition-transform group-hover:translate-x-1 group-hover:text-white" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal for creating/editing subject */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingSubject ? "Edit Subject" : "Add New Subject"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateSubject} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Introduction to Computing"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={newSubjectCode}
                  onChange={(e) => setNewSubjectCode(e.target.value)}
                  placeholder="e.g. CS101"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500"
                >
                  {editingSubject ? "Update Subject" : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
