"use client";

import { useState, useEffect, use } from "react";
import { Plus, Calendar, ArrowLeft, ArrowRight, Pencil, Trash2, X } from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";

interface Semester {
  id: string;
  name: string;
  courseId: string;
}

export default function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = use(params);
  const router = useRouter();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [newSemesterName, setNewSemesterName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Course Details
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          setCourseName(courseDoc.data().name);
        }

        // Fetch Semesters
        const q = query(
          collection(db, "semesters"),
          where("courseId", "==", courseId)
        );
        const querySnapshot = await getDocs(q);
        const fetchedSemesters: Semester[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSemesters.push({ id: doc.id, ...doc.data() } as Semester);
        });
        // Sort semesters by name (simple sort)
        fetchedSemesters.sort((a, b) => a.name.localeCompare(b.name));
        setSemesters(fetchedSemesters);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  const handleCreateOrUpdateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSemesterName) return;

    try {
      if (editingSemester) {
        // Update existing semester
        await updateDoc(doc(db, "semesters", editingSemester.id), {
          name: newSemesterName,
        });

        setSemesters(semesters.map(s => 
          s.id === editingSemester.id 
            ? { ...s, name: newSemesterName } 
            : s
        ));
      } else {
        // Create new semester
        const docRef = await addDoc(collection(db, "semesters"), {
          name: newSemesterName,
          courseId,
          createdAt: new Date(),
        });

        setSemesters([
          ...semesters,
          { id: docRef.id, name: newSemesterName, courseId },
        ]);
      }
      
      closeModal();
    } catch (error) {
      console.error("Error saving semester:", error);
    }
  };

  const handleDeleteSemester = async (semesterId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this semester?")) return;

    try {
      await deleteDoc(doc(db, "semesters", semesterId));
      setSemesters(semesters.filter(s => s.id !== semesterId));
    } catch (error) {
      console.error("Error deleting semester:", error);
    }
  };

  const openEditModal = (semester: Semester, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingSemester(semester);
    setNewSemesterName(semester.name);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
    setNewSemesterName("");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="rounded-full bg-white/5 p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-white">{courseName}</h2>
          <p className="text-gray-400">Select a semester</p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black transition-transform hover:scale-105"
        >
          <Plus size={20} />
          Add Semester
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
      ) : semesters.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
          <Calendar className="mb-4 h-12 w-12 text-gray-600" />
          <h3 className="text-xl font-semibold text-white">No semesters yet</h3>
          <p className="text-gray-400">
            Add a semester to start organizing subjects
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => (
            <Link
              key={semester.id}
              href={`/dashboard/${courseId}/${semester.id}`}
              className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 transition-all hover:border-yellow-400/50 hover:bg-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-400/10 text-yellow-400 group-hover:bg-yellow-400 group-hover:text-black transition-colors">
                  <Calendar size={24} />
                </div>
                <h3 className="text-lg font-bold text-white">{semester.name}</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => openEditModal(semester, e)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSemester(semester.id, e)}
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

      {/* Modal for creating/editing semester */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">
                {editingSemester ? "Edit Semester" : "Add New Semester"}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateSemester} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Semester Name
                </label>
                <input
                  type="text"
                  value={newSemesterName}
                  onChange={(e) => setNewSemesterName(e.target.value)}
                  placeholder="e.g. Semester 1"
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
                  {editingSemester ? "Update Semester" : "Add Semester"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
