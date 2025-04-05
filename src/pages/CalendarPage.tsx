import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function CalendarPage() {
  const location = useLocation();
  const [selectedClass, setSelectedClass] = useState('All classes');
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    if (location.state?.date) {
      setCurrentDate(new Date(location.state.date));
    }
  }, [location.state?.date]);

  // Get the start of the week (Sunday)
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  // Generate array of dates for the week
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    return date;
  });

  const formatDateRange = () => {
    const endDate = new Date(startOfWeek);
    endDate.setDate(startOfWeek.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${startOfWeek.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentDate(newDate);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="h-[calc(100vh-120px)] bg-[#f9f9f9] overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 pt-4 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="relative inline-block min-w-[200px]">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-[15px] text-gray-700 focus:outline-none focus:border-blue-500 hover:bg-gray-50"
            >
              <option>All classes</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <ChevronDown size={20} />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-[#3c4043] text-[15px] font-medium">{formatDateRange()}</span>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <ChevronRight size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
          <div className="grid grid-cols-7 h-full">
            {weekDates.map((date, index) => (
              <div 
                key={date.toISOString()} 
                className={`bg-white ${index !== 6 ? 'border-r border-gray-100' : ''}`}
              >
                <div className="text-center py-2.5 border-b border-gray-100">
                  <div className="text-[11px] text-[#70757a] font-medium uppercase tracking-wide">
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                  </div>
                  <div 
                    className={`text-[26px] mt-0.5 mx-auto
                      ${isToday(date) 
                        ? 'text-white bg-[#1a73e8] rounded-full w-10 h-10 flex items-center justify-center font-normal' 
                        : 'text-[#3c4043] font-light'
                      }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
                <div className="h-full">
                  {/* Event content will go here */}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}