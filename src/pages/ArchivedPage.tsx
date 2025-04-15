import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Course } from '../types/course';
import { Archive, RotateCcw } from 'lucide-react';
import { useState } from 'react';

export default function ArchivedPage() {
  const queryClient = useQueryClient();
  const [restoringClass, setRestoringClass] = useState<string | null>(null);

  const { data: archivedClasses, isLoading } = useQuery<Course[]>({
    queryKey: ['archivedClasses'],
    queryFn: () => {
      const archived = localStorage.getItem('archivedClasses');
      return archived ? JSON.parse(archived) : [];
    },
  });

  const handleRestore = (course: Course) => {
    setRestoringClass(course.id);
    
    // Store the class back in active classes
    localStorage.setItem(`classData-${course.id}`, JSON.stringify(course));
    
    // Remove from archived classes
    const archived = JSON.parse(localStorage.getItem('archivedClasses') || '[]');
    const updatedArchived = archived.filter((c: Course) => c.id !== course.id);
    localStorage.setItem('archivedClasses', JSON.stringify(updatedArchived));
    
    // Refresh the lists
    queryClient.invalidateQueries({ queryKey: ['archivedClasses'] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
    
    setRestoringClass(null);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Archive className="w-6 h-6 text-gray-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Archived Classes</h1>
      </div>

      {archivedClasses?.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No archived classes found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {archivedClasses?.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200/80 p-4"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{course.name}</h3>
                  <p className="text-sm text-gray-600">{course.section}</p>
                  <p className="text-sm text-gray-500">{course.teacherName}</p>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                  style={{
                    backgroundColor: course.color || '#1a73e8',
                  }}
                >
                  {course.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <button
                onClick={() => handleRestore(course)}
                disabled={restoringClass === course.id}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RotateCcw size={16} />
                <span>{restoringClass === course.id ? 'Restoring...' : 'Restore class'}</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}