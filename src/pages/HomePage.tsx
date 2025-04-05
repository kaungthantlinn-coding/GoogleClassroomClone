import { useQuery } from '@tanstack/react-query';
import { Course } from '../types/course';

export default function HomePage() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      // This would be replaced with actual API call
      return [];
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {courses?.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="h-32 bg-cover bg-center"
            style={{
              backgroundImage: course.coverImage
                ? `url(${course.coverImage})`
                : 'url(https://images.unsplash.com/photo-1577563908411-5077b6dc7624)',
            }}
          />
          <div className="p-4">
            <h3 className="text-xl font-semibold">{course.name}</h3>
            <p className="text-gray-600">{course.section}</p>
            <p className="text-gray-500 text-sm">{course.teacherName}</p>
          </div>
        </div>
      ))}
    </div>
  );
}