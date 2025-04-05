import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';

interface ClassActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'join' | 'create';
}

export default function ClassActionDialog({ isOpen, onClose, type }: ClassActionDialogProps) {
  const user = useAuthStore((state) => state.user);
  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement join/create logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-[450px] overflow-hidden">
        {type === 'join' ? (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Join class</h2>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[#f8f9fa] mb-6">
                  <img
                    src={`data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDABQODxIPDRQSEBIXFRQdHx4eHRoaHSQtJSEkMj4xLy4vMTQ6PTo0OjQ5MDc2QEA2OkU9O0RERVlJVENWd1ZFWUf/2wBDAR`} 
                    alt="User"
                    className="w-8 h-8 rounded-full"
                  />
                  <div>
                    <p className="text-sm text-[#3c4043]">You're currently signed in as</p>
                    <p className="text-sm text-[#3c4043] font-medium">{user?.email || 'user@example.com'}</p>
                  </div>
                  <button className="ml-auto text-[#1a73e8] text-sm font-medium">
                    Switch account
                  </button>
                </div>
                <div className="mb-2">
                  <label className="block text-sm text-[#3c4043] mb-1">
                    Class code
                  </label>
                  <p className="text-sm text-[#5f6368] mb-4">
                    Ask your teacher for the class code, then enter it here.
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="Class code"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                />
                <p className="mt-2 text-xs text-[#5f6368]">
                  Use a class code with 5-8 letters or numbers, and no spaces or symbols
                </p>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-[#1a73e8] font-medium hover:bg-[#f6fafe] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a73e8] text-white font-medium rounded hover:bg-[#1557b0] disabled:opacity-50 disabled:hover:bg-[#1a73e8]"
                  disabled={!classCode}
                >
                  Join
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-[22px] font-normal text-[#3c4043]">Create class</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-5">
                <div>
                  <input
                    type="text"
                    placeholder="Class name (required)"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Section"
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Room"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-[#1a73e8] font-medium hover:bg-[#f6fafe] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#1a73e8] text-white font-medium rounded hover:bg-[#1557b0] disabled:opacity-50 disabled:hover:bg-[#1a73e8]"
                  disabled={!className}
                >
                  Create
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}