import React, { useState } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface ClassActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'join' | 'create';
}

export default function ClassActionDialog({ isOpen, onClose, type }: ClassActionDialogProps) {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [showWorkspaceDialog, setShowWorkspaceDialog] = useState(true);
  const [acceptedWorkspaceTerms, setAcceptedWorkspaceTerms] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'name') {
      setClassName(value);
    } else if (name === 'section') {
      setSection(value);
    } else if (name === 'subject') {
      setSubject(value);
    } else if (name === 'room') {
      setRoom(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'create') {
      // Generate a random class code (similar to Google Classroom's format)
      const classCode = Math.random().toString(36).substring(2, 10);
      
      // Here you would typically make an API call to create the class
      // For now, we'll just navigate to the new class page
      navigate(`/class/${classCode}`, { 
        state: { 
          name: className,
          section,
          subject,
          room,
          classCode,
          isNewClass: true 
        } 
      });
    }
    onClose();
  };

  if (showWorkspaceDialog) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-[450px] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-[22px] font-normal text-[#3c4043]">Using Classroom at a school with students?</h2>
          </div>
          <div className="p-6">
            <p className="text-[#3c4043] mb-4">
              If so, your school must sign up for a{' '}
              <a href="#" className="text-[#1a73e8] hover:underline">
                Google Workspace for Education
              </a>{' '}
              account before you can use Classroom.{' '}
              <a href="#" className="text-[#1a73e8] hover:underline">
                Learn More
              </a>
            </p>
            <p className="text-[#3c4043] mb-6">
              Google Workspace for Education lets schools decide which Google services their students can use, and provides additional{' '}
              <a href="#" className="text-[#1a73e8] hover:underline">
                privacy and security
              </a>{' '}
              protections that are important in a school setting. Students cannot use Google Classroom at a school with personal accounts.
            </p>
            <div className="bg-[#f8f9fa] p-4 rounded-lg mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={acceptedWorkspaceTerms}
                  onChange={(e) => setAcceptedWorkspaceTerms(e.target.checked)}
                />
                <span className="text-sm text-[#3c4043]">
                  I've read and understand the above notice, and I'm not using Classroom at a school with students
                </span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
              >
                Go back
              </button>
              <button
                onClick={() => setShowWorkspaceDialog(false)}
                disabled={!acceptedWorkspaceTerms}
                className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={className}
                    onChange={handleInputChange}
                    placeholder="Class name (required)"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="section"
                    value={section}
                    onChange={handleInputChange}
                    placeholder="Section"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="subject"
                    value={subject}
                    onChange={handleInputChange}
                    placeholder="Subject"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="room"
                    value={room}
                    onChange={handleInputChange}
                    placeholder="Room"
                    className="w-full px-3 py-2 border-b border-gray-300 focus:border-[#1a73e8] focus:outline-none text-[#3c4043]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6fafe] rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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