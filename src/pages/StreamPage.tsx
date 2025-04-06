import React, { useState } from 'react';
import AnnouncementInput from '../components/AnnouncementInput';
import ReusePostModal from '../components/ReusePostModal';

const StreamPage = () => {
  const [showReusePostModal, setShowReusePostModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState('Riso Batch 3');

  const handleAnnounce = () => {
    // Handle announcement creation
    console.log('Create announcement');
  };

  const handleReuse = () => {
    setShowReusePostModal(true);
  };

  const handleReusePost = (postId: string) => {
    // Handle reusing the post here
    setShowReusePostModal(false);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-6">
      <AnnouncementInput
        onAnnounce={handleAnnounce}
        onReuse={handleReuse}
      />

      {/* Reuse Post Modal */}
      <ReusePostModal
        isOpen={showReusePostModal}
        onClose={() => setShowReusePostModal(false)}
        selectedClass={selectedClass}
        onReuse={handleReusePost}
      />
    </div>
  );
};

export default StreamPage; 