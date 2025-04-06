import React, { useState } from 'react';
import { Repeat } from 'lucide-react';

interface AnnouncementInputProps {
  onAnnounce: () => void;
  onReuse: () => void;
}

const AnnouncementInput = ({ onAnnounce, onReuse }: AnnouncementInputProps) => {
  const [showReuseForm, setShowReuseForm] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-[#e0e0e0] p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-[#1a73e8] flex items-center justify-center text-white text-[15px]">
          K
        </div>
        <div className="flex-1">
          <button
            onClick={onAnnounce}
            className="w-full px-4 py-3 text-left text-[#5f6368] bg-[#f8f9fa] rounded hover:bg-[#f1f3f4] text-sm"
          >
            Announce something to your class
          </button>
        </div>
        <button
          onClick={onReuse}
          className="p-2 hover:bg-[#f8f9fa] rounded-full"
          title="Reuse post"
        >
          <Repeat size={20} className="text-[#5f6368] rotate-90" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementInput; 