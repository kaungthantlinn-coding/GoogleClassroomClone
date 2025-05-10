// Clear all related localStorage data
localStorage.removeItem('students');
localStorage.removeItem('submissions');
localStorage.removeItem('gradedSubmission');
localStorage.removeItem('courses');
localStorage.removeItem('announcements');
localStorage.removeItem('assignments');

// For debugging, log what was cleared
console.log('All student and course data has been cleared from localStorage');
console.log('Current localStorage items:', Object.keys(localStorage));

// Force reload the page
window.location.reload(); 