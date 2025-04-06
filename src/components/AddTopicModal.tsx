import React, { useState } from 'react';

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (topic: string) => void;
}

const AddTopicModal = ({ isOpen, onClose, onAdd }: AddTopicModalProps) => {
  const [topic, setTopic] = useState('');
  const maxLength = 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-[400px] rounded-lg shadow-xl">
        <div className="p-6">
          <h2 className="text-[#3c4043] text-[22px] font-normal mb-6">Add topic</h2>
          
          <div className="relative bg-[#f8f9fa] rounded">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value.slice(0, maxLength))}
              placeholder="Topic"
              className="w-full px-3 py-2 bg-transparent border-b border-[#1a73e8] text-[#3c4043] placeholder-[#5f6368] text-[14px] focus:outline-none"
            />
            <div className="absolute right-2 bottom-2 text-xs text-[#5f6368]">
              {topic.length}/{maxLength}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4">
          <button
            onClick={onClose}
            className="px-6 py-2 text-sm text-[#1a73e8] hover:bg-[#f6fafe] rounded font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (topic.trim()) {
                onAdd(topic);
                onClose();
              }
            }}
            disabled={!topic.trim()}
            className={`px-6 py-2 text-sm rounded font-medium ${
              topic.trim()
                ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                : 'bg-[#e8eaed] text-[#5f6368] cursor-not-allowed'
            }`}
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTopicModal; 