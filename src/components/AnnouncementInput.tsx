import React, { useState, useContext } from 'react';
import { Bold, Italic, Underline, Youtube, Upload, Link2, Users } from 'lucide-react';
import { ClassDataContext } from '../pages/ClassPage';

const AnnouncementInput = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const classData = useContext(ClassDataContext);

  return (
    <div className="bg-white rounded-lg border border-[#dadce0] shadow-sm">
      {!isExpanded ? (
        <div 
          className="flex items-start p-4 cursor-text" 
          onClick={() => setIsExpanded(true)}
        >
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-sm">
            US
          </div>
          <div className="flex-1 ml-3">
            <div className="w-full py-2 text-sm text-[#5f6368]">
              Announce something to your class
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6">
          {/* Recipients Selection */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[#3c4043] text-[13px]">For</span>
            <div className="flex items-center gap-2 flex-1">
              <button className="px-4 py-2 text-[13px] rounded-md bg-[#f8f9fa] hover:bg-[#f1f3f4] flex items-center gap-2">
                {classData.className} {classData.section}
                <svg className="w-4 h-4 text-[#5f6368]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                </svg>
              </button>
              <button className="px-4 py-2 text-[13px] rounded-md border border-[#dadce0] hover:bg-[#f8f9fa] flex items-center gap-2 text-[#1967d2]">
                <Users size={16} />
                All students
              </button>
            </div>
          </div>

          {/* Text Input */}
          <div className="bg-[#f8f9fa] rounded-lg p-4 mb-4">
            <input
              type="text"
              placeholder="Announce something to your class"
              className="w-full bg-transparent border-none outline-none text-[#3c4043] text-[13px] placeholder-[#5f6368]"
            />
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <Bold size={18} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <Italic size={18} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <Underline size={18} className="text-[#444746]" />
              </button>
              <div className="h-5 w-[1px] bg-[#dadce0] mx-1"></div>
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <svg className="w-[18px] h-[18px] text-[#444746]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/>
                </svg>
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded">
                <svg className="w-[18px] h-[18px] text-[#444746]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M9 18h12v-2H9v2zM3 6v2h18V6H3zm6 7h12v-2H9v2z"/>
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#f1f3f4] rounded-full">
                <svg className="w-5 h-5 text-[#444746]" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                </svg>
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded-full">
                <Youtube size={20} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded-full">
                <Upload size={20} className="text-[#444746]" />
              </button>
              <button className="p-2 hover:bg-[#f1f3f4] rounded-full">
                <Link2 size={20} className="text-[#444746]" />
              </button>
              <button 
                onClick={() => setIsExpanded(false)}
                className="px-6 py-2 text-[#1967d2] hover:bg-[#f6fafe] rounded text-sm"
              >
                Cancel
              </button>
              <button className="px-6 py-2 bg-[#e2e2e2] text-[#666] rounded text-sm font-medium">
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementInput; 