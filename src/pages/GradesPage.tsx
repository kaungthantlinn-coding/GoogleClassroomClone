import React from 'react';
import { Calendar, BellDot, Settings } from 'lucide-react';
import { Link, useParams, useLocation } from 'react-router-dom';

export default function GradesPage() {
  const { classId } = useParams();
  const location = useLocation();

  // Get current path to determine active tab
  const currentPath = location.pathname;
  const isStream = currentPath.endsWith('/stream') || currentPath === `/class/${classId}`;
  const isClasswork = currentPath.endsWith('/classwork');
  const isPeople = currentPath.endsWith('/people');
  const isGrades = currentPath.endsWith('/grades');

  const EmptyStateIllustration = () => (
    <svg width="221" height="161" viewBox="0 0 221 161" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="w-48 h-48">
      <path d="M87.7409 39.2803L37.25 94.8202L175.258 93.9787L219.859 40.9633L87.7409 39.2803Z" fill="#DADCE0"/>
      <path d="M158.849 67.0498L149.592 68.7328L42.7197 88.9292L59.55 68.7328L158.849 67.0498Z" fill="#606266"/>
      <path d="M219.269 48.1162L175.511 100.29H120.812M218.849 58.6351L175.511 109.126L96.4082 108.284" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M175.511 93.9785V116.699" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M219.69 41.8047L218.849 67.4709L175.09 117.12L79.1572 115.858" stroke="#606266" strokeWidth="2" strokeLinecap="round"/>
      <path d="M39.438 103.404C57.0256 102.478 74.5291 101.973 92.1168 101.637C109.62 101.3 127.208 101.216 144.711 101.132C154.641 101.048 164.571 101.048 174.501 100.963C175.679 100.963 175.763 99.0279 174.501 99.112C156.913 99.2803 139.326 99.3645 121.738 99.4486C104.235 99.617 86.6469 99.8694 69.1434 100.374C59.2136 100.711 49.2837 101.048 39.3538 101.552C38.1757 101.552 38.1757 103.488 39.438 103.404Z" fill="#606266"/>
      <circle cx="110" cy="80" r="25" fill="#CEEAD6" className="rTGbBf"/>
      <path d="M110 65V95M95 80H125" stroke="#1E8E3E" strokeWidth="4" strokeLinecap="round"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9]">
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-[#e0e0e0] w-full">
        <div className="flex justify-between items-center w-full px-6">
          <nav className="flex">
            <Link
              to={`/class/${classId}/stream`}
              className={`px-4 py-[14px] text-[14px] ${
                isStream 
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium" 
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
              }`}
            >
              Stream
            </Link>
            <Link
              to={`/class/${classId}/classwork`}
              className={`px-4 py-[14px] text-[14px] ${
                isClasswork 
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium" 
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
              }`}
            >
              Classwork
            </Link>
            <Link
              to={`/class/${classId}/people`}
              className={`px-4 py-[14px] text-[14px] ${
                isPeople 
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium" 
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
              }`}
            >
              People
            </Link>
            <Link
              to={`/class/${classId}/grades`}
              className={`px-4 py-[14px] text-[14px] ${
                isGrades 
                  ? "text-[#1967d2] border-b-2 border-[#1967d2] font-medium" 
                  : "text-[#444746] hover:text-[#1967d2] hover:bg-[#f8f9fa]"
              }`}
            >
              Grades
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-[#f8f9fa] rounded-full">
              <Calendar size={20} className="text-[#444746]" />
            </button>
            <button className="p-2 hover:bg-[#f8f9fa] rounded-full">
              <BellDot size={20} className="text-[#444746]" />
            </button>
            <button className="p-2 hover:bg-[#f8f9fa] rounded-full">
              <Settings size={20} className="text-[#444746]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1000px] mx-auto px-6 py-6">
        <div className="flex flex-col items-center justify-center py-16">
          <EmptyStateIllustration />
          <div className="text-center">
            <h3 className="text-[22px] text-[#3c4043] mb-2">This is where you'll view and manage grades</h3>
          </div>
        </div>
      </div>
    </div>
  );
} 