import React from 'react';
import { X, AlertTriangle, Archive } from 'lucide-react';

interface ArchiveConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  className: string;
  currentStep: number;
  setCurrentStep: (step: number) => void;
}

const ArchiveConfirmationModal: React.FC<ArchiveConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  className,
  currentStep,
  setCurrentStep,
}) => {
  if (!isOpen) return null;

  const steps = [
    {
      title: 'Archive class',
      description: 'Are you sure you want to archive this class?',
      icon: <Archive className="w-8 h-8 text-blue-600" />,
    },
    {
      title: 'Archive confirmation',
      description: 'This class will be moved to the archived classes section. You can restore it later if needed.',
      icon: <AlertTriangle className="w-8 h-8 text-yellow-500" />,
    },
    {
      title: 'Final confirmation',
      description: 'Click confirm to archive this class. This action cannot be undone.',
      icon: <AlertTriangle className="w-8 h-8 text-red-500" />,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div 
        className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative"
        style={{ 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          zIndex: 10000
        }}
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {steps[currentStep].icon}
            <h2 className="text-xl font-semibold text-gray-900">{steps[currentStep].title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X size={24} />
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">{steps[currentStep].description}</p>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleNext}
            className={`px-4 py-2 rounded-md ${
              currentStep === steps.length - 1
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {currentStep === steps.length - 1 ? 'Confirm' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchiveConfirmationModal; 