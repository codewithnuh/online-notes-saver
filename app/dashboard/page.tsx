"use client";

import { useState, useEffect } from "react";
import { Plus, Book, ArrowRight } from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/_contexts/AuthContext";

interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
}

const GRADIENTS = [
  "from-yellow-400 to-orange-500",
  "from-purple-500 to-pink-500",
  "from-blue-400 to-cyan-400",
  "from-green-400 to-emerald-500",
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchCourses = async () => {
      try {
        const q = query(
          collection(db, "courses"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const fetchedCourses: Course[] = [];
        querySnapshot.forEach((doc) => {
          fetchedCourses.push({ id: doc.id, ...doc.data() } as Course);
        });
        setCourses(fetchedCourses);
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCourseName || !newCourseCode) return;

    try {
      const color = GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)];
      const docRef = await addDoc(collection(db, "courses"), {
        name: newCourseName,
        code: newCourseCode,
        userId: user.uid,
        color,
        createdAt: new Date(),
      });

      setCourses([
        ...courses,
        { id: docRef.id, name: newCourseName, code: newCourseCode, color },
      ]);
      setIsModalOpen(false);
      setNewCourseName("");
      setNewCourseCode("");
    } catch (error) {
      console.error("Error creating course:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">My Courses</h2>
          <p className="text-gray-400">Manage your academic journey</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2 font-semibold text-black transition-transform hover:scale-105"
        >
          <Plus size={20} />
          Add Course
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl bg-white/5"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/5 text-center">
          <Book className="mb-4 h-12 w-12 text-gray-600" />
          <h3 className="text-xl font-semibold text-white">No courses yet</h3>
          <p className="text-gray-400">
            Create your first course to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/${course.id}`}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 transition-all hover:border-white/20 hover:bg-white/5"
            >
              <div
                className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${course.color} opacity-20 blur-2xl transition-opacity group-hover:opacity-30`}
              />
              
              <div className="relative z-10">
                <div className={`mb-4 inline-flex rounded-lg bg-gradient-to-br ${course.color} p-3 text-white shadow-lg`}>
                  <Book size={24} />
                </div>
                <h3 className="mb-1 text-xl font-bold text-white">
                  {course.name}
                </h3>
                <p className="mb-6 text-sm font-medium text-gray-400">
                  {course.code}
                </p>
                
                <div className="flex items-center gap-2 text-sm font-medium text-white/50 transition-colors group-hover:text-white">
                  View Semesters
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Simple Modal for creating course */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f0f] p-6 shadow-2xl">
            <h3 className="mb-4 text-xl font-bold text-white">Add New Course</h3>
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Course Name
                </label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Software Engineering"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-400">
                  Course Code
                </label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="e.g. BSSE"
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-gray-600 focus:border-yellow-400 focus:outline-none"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-black hover:bg-yellow-500"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
