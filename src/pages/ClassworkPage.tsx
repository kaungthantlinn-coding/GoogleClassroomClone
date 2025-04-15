import React, { useState, useContext, useEffect } from 'react';
import { FileText, Plus, HelpCircle, RotateCcw, List, X, ChevronDown, Users, Upload, Link as LinkIcon } from 'lucide-react';
import SelectClassModal from '../components/SelectClassModal';
import ReusePostModal from '../components/ReusePostModal';
import AddTopicModal from '../components/AddTopicModal';
import { ClassDataContext } from './ClassPage';

const ClassworkPage = () => {
  const classData = useContext(ClassDataContext);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [showSelectClassModal, setShowSelectClassModal] = useState(false);
  const [showReusePostModal, setShowReusePostModal] = useState(false);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState(classData.className || 'Class');
  const [points, setPoints] = useState('100');
  const [dueDate, setDueDate] = useState('No due date');
  const [topic, setTopic] = useState('No topic');
  const [answerType, setAnswerType] = useState('Short answer');
  const [studentsCanReply, setStudentsCanReply] = useState(true);
  const [studentsCanEdit, setStudentsCanEdit] = useState(false);

  // Update document title when class data changes
  useEffect(() => {
    const className = classData.className || 'Class';
    const section = classData.section ? ` - ${classData.section}` : '';
    document.title = `${className}${section} - Classwork - Google Classroom`;
  }, [classData]);

  const closeAllForms = () => {
    setShowAssignmentForm(false);
    setShowQuizForm(false);
    setShowQuestionForm(false);
    setShowMaterialForm(false);
    setShowSelectClassModal(false);
    setShowReusePostModal(false);
    setShowAddTopicModal(false);
    setIsCreateMenuOpen(false);
  };

  const handleSelectClass = (classId: string) => {
    setShowSelectClassModal(false);
    setShowReusePostModal(true);
  };

  const handleReusePost = (postId: string) => {
    // Handle reusing the post here
    setShowReusePostModal(false);
    // You would typically make an API call to copy the post to the current class
  };

  const handleAddTopic = (newTopic: string) => {
    // Handle adding the new topic here
    console.log('New topic:', newTopic);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-6">
      {/* Create Button */}
      <div className="relative mb-6">
        <button
          onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
          className="flex items-center gap-2 px-6 py-2 bg-[#1a73e8] text-white rounded-full text-sm font-medium hover:bg-[#1557b0] transition-colors"
        >
          <Plus size={20} />
          Create
        </button>

        {/* Create Menu Dropdown */}
        {isCreateMenuOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <button 
              onClick={() => {
                setShowAssignmentForm(true);
                setShowQuizForm(false);
                setShowQuestionForm(false);
                setShowMaterialForm(false);
                setIsCreateMenuOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm"
            >
              <FileText size={20} className="text-gray-600" />
              Assignment
            </button>
            <button 
              onClick={() => {
                setShowQuizForm(true);
                setShowAssignmentForm(false);
                setShowQuestionForm(false);
                setShowMaterialForm(false);
                setIsCreateMenuOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm"
            >
              <FileText size={20} className="text-gray-600" />
              Quiz assignment
            </button>
            <button 
              onClick={() => {
                setShowQuestionForm(true);
                setShowAssignmentForm(false);
                setShowQuizForm(false);
                setShowMaterialForm(false);
                setIsCreateMenuOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm"
            >
              <HelpCircle size={20} className="text-gray-600" />
              Question
            </button>
            <button 
              onClick={() => {
                setShowMaterialForm(true);
                setShowAssignmentForm(false);
                setShowQuizForm(false);
                setShowQuestionForm(false);
                setIsCreateMenuOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm"
            >
              <FileText size={20} className="text-gray-600" />
              Material
            </button>
            <button 
              onClick={() => {
                setShowSelectClassModal(true);
                setIsCreateMenuOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm"
            >
              <RotateCcw size={20} className="text-gray-600" />
              Reuse post
            </button>
            <div className="border-t border-gray-200 my-2"></div>
            <button 
              onClick={() => {
                setShowAddTopicModal(true);
                setIsCreateMenuOpen(false);
              }}
              className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 text-sm"
            >
              <List size={20} className="text-gray-600" />
              Topic
            </button>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!showAssignmentForm && !showQuizForm && !showQuestionForm && !showMaterialForm && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex flex-col items-center py-16">
            <img
              src="/classwork-empty.svg"
              alt="Empty classwork"
              className="w-[240px] h-[240px] mb-6"
            />
            <h2 className="text-[22px] text-[#3c4043] font-normal mb-1">
              This is where you'll assign work
            </h2>
            <p className="text-[#5f6368] text-[14px] text-center">
              You can add assignments and other work for the class, then organize it into topics
            </p>
          </div>
        </div>
      )}

      {/* Material Form */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
          <div className="bg-white w-full max-w-[1000px] rounded-lg h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowMaterialForm(false)}>
                  <X size={24} className="text-[#5f6368]" />
                </button>
                <div className="flex items-center gap-3">
                  <FileText className="text-[#5f6368]" size={24} />
                  <h1 className="text-[32px] text-[#3c4043] font-normal">Material</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-6 py-2 text-sm text-[#444746] hover:bg-[#f8f9fa] rounded">
                  Cancel
                </button>
                <button className="px-6 py-2 text-sm bg-[#1a73e8] text-white rounded hover:bg-[#1557b0] font-medium">
                  Post
                </button>
              </div>
            </div>

            <div className="flex p-6">
              {/* Left side - Material form */}
              <div className="flex-1 pr-6">
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full px-3 py-4 text-[#3c4043] placeholder-[#5f6368] bg-[#f8f9fa] rounded-t border-b border-[#e0e0e0] focus:outline-none text-[16px]"
                  />

                  <div className="bg-[#f8f9fa] p-4 rounded">
                    <textarea
                      placeholder="Description (optional)"
                      className="w-full min-h-[100px] bg-transparent placeholder-[#5f6368] focus:outline-none resize-none text-[14px]"
                    />
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="font-bold">B</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="italic">I</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="underline">U</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="text-[#5f6368]">≡</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attach Section */}
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-4">Attach</h3>
                    <div className="flex gap-4">
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Drive</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">YouTube</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <Plus size={24} className="text-[#5f6368]" />
                        <span className="text-xs text-[#5f6368]">Create</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/upload-icon.svg" alt="Upload" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Upload</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/link-icon.svg" alt="Link" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Material settings */}
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
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {topic}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quiz Assignment Form */}
      {showQuizForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
          <div className="bg-white w-full max-w-[1000px] rounded-lg h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowQuizForm(false)}>
                  <X size={24} className="text-[#5f6368]" />
                </button>
                <div className="flex items-center gap-3">
                  <FileText className="text-[#5f6368]" size={24} />
                  <h1 className="text-[32px] text-[#3c4043] font-normal">Assignment</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-6 py-2 text-sm text-[#444746] hover:bg-[#f8f9fa] rounded">
                  Cancel
                </button>
                <button className="px-6 py-2 text-sm bg-[#1a73e8] text-white rounded hover:bg-[#1557b0] font-medium">
                  Assign
                </button>
              </div>
            </div>

            <div className="flex p-6">
              {/* Left side - Assignment form */}
              <div className="flex-1 pr-6">
                <div className="space-y-6">
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full px-3 py-4 text-[#3c4043] placeholder-[#5f6368] bg-[#f8f9fa] rounded-t border-b border-[#e0e0e0] focus:outline-none text-[16px]"
                  />

                  <div className="bg-[#f8f9fa] p-4 rounded">
                    <textarea
                      placeholder="Instructions (optional)"
                      className="w-full min-h-[100px] bg-transparent placeholder-[#5f6368] focus:outline-none resize-none text-[14px]"
                    />
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="font-bold">B</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="italic">I</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="underline">U</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="text-[#5f6368]">≡</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[#edf2fa] rounded-full">
                          <Upload size={20} className="text-[#5f6368]" />
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded-full">
                          <LinkIcon size={20} className="text-[#5f6368]" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Quiz Form */}
                  <div className="bg-white border border-[#e0e0e0] rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <img src="https://www.gstatic.com/images/branding/product/1x/forms_48dp.png" alt="Google Forms" className="w-6 h-6" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#3c4043]">Blank Quiz</span>
                          <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-3 py-1 rounded">
                            Change
                          </button>
                        </div>
                        <span className="text-xs text-[#5f6368]">Google Forms</span>
                      </div>
                      <button className="p-1 hover:bg-[#f8f9fa] rounded">
                        <X size={20} className="text-[#5f6368]" />
                      </button>
                    </div>
                    <button className="w-full text-left text-sm text-[#1a73e8] hover:bg-[#f6fafe] px-3 py-2 rounded">
                      + Add question
                    </button>
                  </div>

                  {/* Attach Section */}
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-4">Attach</h3>
                    <div className="flex gap-4">
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Drive</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">YouTube</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <Plus size={24} className="text-[#5f6368]" />
                        <span className="text-xs text-[#5f6368]">Create</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/upload-icon.svg" alt="Upload" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Upload</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/link-icon.svg" alt="Link" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Assignment settings */}
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#3c4043]">Points</h3>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {points}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#3c4043]">Due</h3>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {dueDate}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#3c4043]">Topic</h3>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {topic}
                    </button>
                  </div>
                </div>

                <div>
                  <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-4 py-2 rounded flex items-center gap-1">
                    <Plus size={16} />
                    Rubric
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Form */}
      {showQuestionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
          <div className="bg-white w-full max-w-[1000px] rounded-lg h-[calc(100vh-100px)] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowQuestionForm(false)}>
                  <X size={24} className="text-[#5f6368]" />
                </button>
                <div className="flex items-center gap-3">
                  <HelpCircle className="text-[#5f6368]" size={24} />
                  <h1 className="text-[32px] text-[#3c4043] font-normal">Question</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-6 py-2 text-sm text-[#444746] hover:bg-[#f8f9fa] rounded">
                  Cancel
                </button>
                <button className="px-6 py-2 text-sm bg-[#1a73e8] text-white rounded hover:bg-[#1557b0] font-medium">
                  Ask
                </button>
              </div>
            </div>

            <div className="flex p-6">
              {/* Left side - Question form */}
              <div className="flex-1 pr-6">
                <div className="space-y-6">
                  <div className="flex gap-6">
                    <input
                      type="text"
                      placeholder="Question"
                      className="flex-1 px-3 py-4 text-[#3c4043] placeholder-[#5f6368] bg-[#f8f9fa] rounded-t border-b border-[#e0e0e0] focus:outline-none text-[16px]"
                    />
                    <button className="w-[200px] px-3 py-4 text-[#3c4043] bg-[#f8f9fa] rounded-t border-b border-[#e0e0e0] flex items-center justify-between">
                      <span className="text-sm">{answerType}</span>
                      <ChevronDown size={16} className="text-[#5f6368]" />
                    </button>
                  </div>

                  <div className="bg-[#f8f9fa] p-4 rounded">
                    <textarea
                      placeholder="Instructions (optional)"
                      className="w-full min-h-[100px] bg-transparent placeholder-[#5f6368] focus:outline-none resize-none text-[14px]"
                    />
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="font-bold">B</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="italic">I</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="underline">U</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="text-[#5f6368]">≡</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attach Section */}
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-4">Attach</h3>
                    <div className="flex gap-4">
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Drive</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">YouTube</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <Plus size={24} className="text-[#5f6368]" />
                        <span className="text-xs text-[#5f6368]">Create</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/upload-icon.svg" alt="Upload" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Upload</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/link-icon.svg" alt="Link" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side - Question settings */}
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#3c4043]">Points</h3>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {points}
                    </button>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-[#3c4043]">Due</h3>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {dueDate}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-[#3c4043]">Topic</h3>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-2 py-1 rounded">
                      {topic}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={studentsCanReply}
                      onChange={(e) => setStudentsCanReply(e.target.checked)}
                      className="form-checkbox text-[#1a73e8] rounded"
                    />
                    <span className="text-sm text-[#3c4043]">Students can reply to each other</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={studentsCanEdit}
                      onChange={(e) => setStudentsCanEdit(e.target.checked)}
                      className="form-checkbox text-[#1a73e8] rounded"
                    />
                    <span className="text-sm text-[#3c4043]">Students can edit answer</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regular Assignment Form */}
      {showAssignmentForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center pt-16 z-50">
          <div className="bg-white w-full max-w-[800px] rounded-lg">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowAssignmentForm(false)}>
                  <X size={24} className="text-[#5f6368]" />
                </button>
                <span className="text-[#3c4043] text-xl">Assignment</span>
              </div>
              <button className="px-6 py-2 bg-[#1a73e8] text-white rounded text-sm font-medium hover:bg-[#1557b0]">
                Assign
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2">
                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full p-3 text-[#3c4043] bg-[#f8f9fa] rounded text-sm focus:outline-none"
                  />
                  <div className="mt-6">
                    <textarea
                      placeholder="Instructions (optional)"
                      className="w-full p-3 text-[#3c4043] bg-[#f8f9fa] rounded-t border-b text-sm focus:outline-none min-h-[100px] resize-none"
                    />
                    <div className="p-3 bg-[#f8f9fa] rounded-b">
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="font-bold">B</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="italic">I</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="underline">U</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="text-[#5f6368]">≡</span>
                        </button>
                        <button className="p-2 hover:bg-[#edf2fa] rounded">
                          <span className="text-[#5f6368]">⚡</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Attach Section */}
                  <div className="mt-6">
                    <h3 className="text-sm text-[#3c4043] mb-2">Attach</h3>
                    <div className="flex gap-4">
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/drive-icon.svg" alt="Drive" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Drive</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/youtube-icon.svg" alt="YouTube" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">YouTube</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <Plus size={24} className="text-[#5f6368]" />
                        <span className="text-xs text-[#5f6368]">Create</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/upload-icon.svg" alt="Upload" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Upload</span>
                      </button>
                      <button className="flex flex-col items-center gap-1 p-4 hover:bg-[#f8f9fa] rounded">
                        <img src="/link-icon.svg" alt="Link" className="w-6 h-6" />
                        <span className="text-xs text-[#5f6368]">Link</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-2">For</h3>
                    <button className="w-full p-2 text-left text-sm border rounded hover:bg-[#f8f9fa]">
                      {selectedClass}
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-2">Points</h3>
                    <button className="w-full p-2 text-left text-sm border rounded hover:bg-[#f8f9fa]">
                      {points}
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-2">Due</h3>
                    <button className="w-full p-2 text-left text-sm border rounded hover:bg-[#f8f9fa]">
                      {dueDate}
                    </button>
                  </div>
                  <div>
                    <h3 className="text-sm text-[#3c4043] mb-2">Topic</h3>
                    <button className="w-full p-2 text-left text-sm border rounded hover:bg-[#f8f9fa]">
                      {topic}
                    </button>
                  </div>
                  <div>
                    <button className="text-[#1a73e8] text-sm hover:bg-[#f6fafe] px-4 py-2 rounded">
                      + Rubric
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Select Class Modal */}
      <SelectClassModal
        isOpen={showSelectClassModal}
        onClose={() => setShowSelectClassModal(false)}
        onSelectClass={handleSelectClass}
      />

      {/* Reuse Post Modal */}
      <ReusePostModal
        isOpen={showReusePostModal}
        onClose={() => setShowReusePostModal(false)}
        selectedClass={selectedClass}
        onReuse={handleReusePost}
      />

      {/* Add Topic Modal */}
      <AddTopicModal
        isOpen={showAddTopicModal}
        onClose={() => setShowAddTopicModal(false)}
        onAdd={handleAddTopic}
      />
    </div>
  );
};

export default ClassworkPage; 