import React, { useState } from 'react';
import { X, FileText, HelpCircle, ChevronDown, Users } from 'lucide-react';

interface Post {
  id: string;
  title: string;
  type: 'assignment' | 'question' | 'material' | 'quiz';
  class: string;
  date: string;
}

interface ReusePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: string;
  onReuse: (postId: string) => void;
}

const ReusePostModal = ({ isOpen, onClose, selectedClass, onReuse }: ReusePostModalProps) => {
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState('No topic');

  const posts: Post[] = [
    {
      id: '1',
      title: 'Assignment 1: Introduction to React',
      type: 'assignment',
      class: 'Riso Batch 3',
      date: 'Apr 5'
    },
    {
      id: '2',
      title: 'Quiz: JavaScript Fundamentals',
      type: 'quiz',
      class: 'Riso Batch 3',
      date: 'Apr 4'
    },
    {
      id: '3',
      title: 'What is your favorite programming language?',
      type: 'question',
      class: 'Riso Batch 3',
      date: 'Apr 3'
    },
    {
      id: '4',
      title: 'React Documentation',
      type: 'material',
      class: 'Riso Batch 3',
      date: 'Apr 2'
    }
  ];

  if (!isOpen) return null;

  const getIcon = (type: Post['type']) => {
    switch (type) {
      case 'question':
        return <HelpCircle size={20} className="text-[#5f6368]" />;
      default:
        return <FileText size={20} className="text-[#5f6368]" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
      <div className="bg-white w-full max-w-[1000px] rounded-lg h-[calc(100vh-100px)] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <button onClick={onClose}>
              <X size={24} className="text-[#5f6368]" />
            </button>
            <h1 className="text-[32px] text-[#3c4043] font-normal">Reuse post</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onClose}
              className="px-6 py-2 text-sm text-[#444746] hover:bg-[#f8f9fa] rounded"
            >
              Cancel
            </button>
            <button
              onClick={() => selectedPost && onReuse(selectedPost)}
              disabled={!selectedPost}
              className={`px-6 py-2 text-sm rounded font-medium ${
                selectedPost
                  ? 'bg-[#1a73e8] text-white hover:bg-[#1557b0]'
                  : 'bg-[#e8eaed] text-[#5f6368] cursor-not-allowed'
              }`}
            >
              Reuse
            </button>
          </div>
        </div>

        <div className="flex p-6">
          {/* Left side - Posts list */}
          <div className="flex-1 pr-6">
            <div className="space-y-2">
              {posts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post.id)}
                  className={`w-full flex items-start gap-4 p-4 rounded text-left ${
                    selectedPost === post.id
                      ? 'border-2 border-[#1a73e8] bg-[#f8f9fa]'
                      : 'hover:bg-[#f8f9fa] border border-transparent'
                  }`}
                >
                  {getIcon(post.type)}
                  <div>
                    <div className="text-[#3c4043] font-medium mb-1">{post.title}</div>
                    <div className="text-sm text-[#5f6368]">
                      {post.type.charAt(0).toUpperCase() + post.type.slice(1)} • {post.class} • {post.date}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right side - Settings */}
          <div className="w-[300px] space-y-4">
            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <h3 className="text-sm font-medium text-[#3c4043] mb-4">For</h3>
              <button className="w-full px-3 py-2 text-sm border rounded hover:bg-[#f8f9fa] flex items-center justify-between">
                <span>{selectedClass}</span>
                <ChevronDown size={16} className="text-[#5f6368]" />
              </button>
              <button className="mt-3 w-full px-3 py-2 text-sm border rounded hover:bg-[#f8f9fa] flex items-center gap-2 text-[#1a73e8]">
                <Users size={16} />
                All students
              </button>
            </div>

            <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#3c4043]">Topic</h3>
                <button 
                  onClick={() => setSelectedTopic(selectedTopic === 'No topic' ? 'Topic 1' : 'No topic')}
                  className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded"
                >
                  {selectedTopic}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReusePostModal; 