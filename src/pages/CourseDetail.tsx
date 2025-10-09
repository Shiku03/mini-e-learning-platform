import { useState, useEffect } from 'react';
import { supabase, Course, Lesson, UserProgress } from '../lib/supabase';
import { ArrowLeft, BookOpen, CheckCircle2, Circle, User, Clock } from 'lucide-react';

interface CourseDetailProps {
  courseId: string;
  onNavigate: (page: string) => void;
}

export default function CourseDetail({ courseId, onNavigate }: CourseDetailProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [markingComplete, setMarkingComplete] = useState(false);

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  const loadCourseData = async () => {
    setLoading(true);

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      console.error('Error loading course:', courseError);
    } else {
      setCourse(courseData);
    }

    const { data: lessonsData, error: lessonsError } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (lessonsError) {
      console.error('Error loading lessons:', lessonsError);
    } else if (lessonsData) {
      setLessons(lessonsData);
    }

    const { data: progressData, error: progressError } = await supabase
      .from('user_progress')
      .select('*')
      .eq('course_id', courseId)
      .maybeSingle();

    if (progressError) {
      console.error('Error loading progress:', progressError);
    } else {
      setProgress(progressData);
    }

    setLoading(false);
  };

  const handleMarkComplete = async () => {
    setMarkingComplete(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('User not authenticated');
      setMarkingComplete(false);
      return;
    }

    if (progress) {
      const { error } = await supabase
        .from('user_progress')
        .update({
          completed: !progress.completed,
          completed_at: !progress.completed ? new Date().toISOString() : null,
        })
        .eq('id', progress.id);

      if (error) {
        console.error('Error updating progress:', error);
      } else {
        setProgress({
          ...progress,
          completed: !progress.completed,
          completed_at: !progress.completed ? new Date().toISOString() : null,
        });
      }
    } else {
      const { data, error } = await supabase
        .from('user_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
      } else {
        setProgress(data);
      }
    }

    setMarkingComplete(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Course not found</p>
          <button
            onClick={() => onNavigate('home')}
            className="text-blue-600 hover:underline"
          >
            Go back to home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Courses</span>
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="relative h-64">
            <img
              src={course.image_url}
              alt={course.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{course.instructor}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.duration}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-3">About this course</h2>
              <p className="text-gray-600 leading-relaxed">{course.description}</p>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">Course Lessons</h2>
                <span className="text-sm text-gray-500">{lessons.length} lessons</span>
              </div>

              {lessons.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">No lessons available yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          <Circle className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-grow">
                          <h3 className="font-semibold text-gray-800 mb-1">
                            Lesson {index + 1}: {lesson.title}
                          </h3>
                          <p className="text-sm text-gray-600">{lesson.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleMarkComplete}
                disabled={markingComplete}
                className={`flex items-center space-x-2 px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${
                  progress?.completed
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {markingComplete
                    ? 'Updating...'
                    : progress?.completed
                    ? 'Mark as Incomplete'
                    : 'Mark as Completed'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
