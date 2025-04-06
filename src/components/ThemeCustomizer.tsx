/** @cSpell words headlessui Customizer bookclub reachout backtoschool */
import { useState } from 'react';
import { Image, Upload, Check } from 'lucide-react';
import { Dialog } from '@headlessui/react';

interface ThemeCustomizerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (theme: { color: string; image: string }) => void;
  currentTheme?: { color: string; image: string };
}

const themeColors = [
  { id: 'blue', color: '#1a73e8' },
  { id: 'green', color: '#1e8e3e' },
  { id: 'pink', color: '#d93025' },
  { id: 'orange', color: '#e37400' },
  { id: 'teal', color: '#129eaf' },
  { id: 'purple', color: '#9334e6' },
  { id: 'lightBlue', color: '#4285f4' },
  { id: 'gray', color: '#5f6368' },
];

const themeCategories = [
  { id: 'general', name: 'General' },
  { id: 'english-history', name: 'English & History' },
  { id: 'math-science', name: 'Math & Science' },
  { id: 'arts', name: 'Arts' },
  { id: 'sports', name: 'Sports' },
  { id: 'other', name: 'Other' },
];

const defaultThemeImages = {
  'general': [
    {
      id: 'breakfast',
      url: 'https://gstatic.com/classroom/themes/img_breakfast.jpg',
      color: '#FB8C00'
    },
    {
      id: 'code',
      url: 'https://gstatic.com/classroom/themes/img_code.jpg',
      color: '#1A73E8'
    },
    {
      id: 'bookclub',
      url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg',
      color: '#1967D2'
    },
    {
      id: 'graduation',
      url: 'https://gstatic.com/classroom/themes/img_graduation.jpg',
      color: '#1E8E3E'
    }
  ],
  'english-history': [
    {
      id: 'graduation',
      url: 'https://gstatic.com/classroom/themes/img_graduation.jpg',
      color: '#D93025'
    },
    {
      id: 'bookclub',
      url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg',
      color: '#1967D2'
    },
    {
      id: 'reachout',
      url: 'https://gstatic.com/classroom/themes/img_reachout.jpg',
      color: '#1E8E3E'
    },
    {
      id: 'devices',
      url: 'https://gstatic.com/classroom/themes/img_code.jpg',
      color: '#1967D2'
    }
  ],
  'math-science': [
    {
      id: 'math',
      url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg',
      color: '#1E8E3E'
    },
    {
      id: 'code',
      url: 'https://gstatic.com/classroom/themes/img_code.jpg',
      color: '#1967D2'
    },
    {
      id: 'graduation',
      url: 'https://gstatic.com/classroom/themes/img_graduation.jpg',
      color: '#D93025'
    },
    {
      id: 'science',
      url: 'https://gstatic.com/classroom/themes/img_reachout.jpg',
      color: '#1E8E3E'
    }
  ],
  'arts': [
    {
      id: 'guitar',
      url: 'https://gstatic.com/classroom/themes/img_concert.jpg',
      color: '#D93025'
    },
    {
      id: 'concert',
      url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg',
      color: '#1967D2'
    },
    {
      id: 'performing_arts',
      url: 'https://gstatic.com/classroom/themes/img_graduation.jpg',
      color: '#1E8E3E'
    },
    {
      id: 'design',
      url: 'https://gstatic.com/classroom/themes/img_code.jpg',
      color: '#129EAF'
    }
  ],
  'sports': [
    {
      id: 'sports',
      url: 'https://gstatic.com/classroom/themes/img_reachout.jpg',
      color: '#1E8E3E'
    },
    {
      id: 'tennis',
      url: 'https://gstatic.com/classroom/themes/img_code.jpg',
      color: '#1967D2'
    },
    {
      id: 'soccer',
      url: 'https://gstatic.com/classroom/themes/img_graduation.jpg',
      color: '#FB8C00'
    },
    {
      id: 'basketball',
      url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg',
      color: '#D93025'
    }
  ],
  'other': [
    {
      id: 'coffee',
      url: 'https://gstatic.com/classroom/themes/img_code.jpg',
      color: '#129EAF'
    },
    {
      id: 'pencils',
      url: 'https://gstatic.com/classroom/themes/img_pencils.jpg',
      color: '#1967D2'
    },
    {
      id: 'backtoschool',
      url: 'https://gstatic.com/classroom/themes/img_bookclub.jpg',
      color: '#1E8E3E'
    },
    {
      id: 'breakfast',
      url: 'https://gstatic.com/classroom/themes/img_graduation.jpg',
      color: '#FB8C00'
    }
  ]
};

export default function ThemeCustomizer({ isOpen, onClose, onSave, currentTheme }: ThemeCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState(currentTheme?.color || themeColors[0].color);
  const [selectedImage, setSelectedImage] = useState(currentTheme?.image || defaultThemeImages.general[0].url);
  const [activeCategory, setActiveCategory] = useState('general');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  const handleSave = () => {
    onSave({ color: selectedColor, image: selectedImage });
    onClose();
  };

  const handleThemeSelect = (image: string, color: string) => {
    setSelectedImage(image);
    setSelectedColor(color);
    setShowThemeSelector(false);
  };

  if (showThemeSelector) {
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-auto">
            <Dialog.Title className="p-6 text-xl font-medium text-[#3c4043] border-b border-gray-200">
              Select class theme
            </Dialog.Title>

            {/* Theme Categories */}
            <div className="p-6">
              <div className="flex gap-6 mb-6 border-b border-gray-200">
                {themeCategories.map((category) => (
                  <button
                    key={category.id}
                    className={`pb-4 text-sm ${
                      activeCategory === category.id
                        ? 'text-[#1a73e8] border-b-2 border-[#1a73e8] -mb-[1px] font-medium'
                        : 'text-[#5f6368] hover:text-[#1a73e8]'
                    }`}
                    onClick={() => setActiveCategory(category.id)}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Theme Images Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {defaultThemeImages[activeCategory as keyof typeof defaultThemeImages].map((theme) => (
                  <button
                    key={theme.id}
                    className={`relative group rounded-lg overflow-hidden aspect-[16/9] ${
                      selectedImage === theme.url ? 'ring-2 ring-[#1a73e8]' : ''
                    }`}
                    onClick={() => handleThemeSelect(theme.url, theme.color)}
                  >
                    <img 
                      src={theme.url} 
                      alt={`Theme ${theme.id}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedImage === theme.url && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Check className="text-white" size={24} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 p-6 bg-gray-50 rounded-b-lg">
              <button
                className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6f9fe] rounded"
                onClick={() => setShowThemeSelector(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 text-white bg-[#1a73e8] hover:bg-[#1557b0] rounded"
                onClick={() => setShowThemeSelector(false)}
              >
                Select class theme
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl bg-white rounded-lg shadow-xl">
          <Dialog.Title className="p-6 text-xl font-medium text-[#3c4043]">
            Customize appearance
          </Dialog.Title>

          {/* Header Image Preview */}
          <div className="relative h-48 overflow-hidden">
            <img 
              src={selectedImage} 
              alt="Theme preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Image Selection */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm text-[#3c4043] mb-4">Select stream header image</p>
            <div className="flex gap-4">
              <button
                className="flex items-center gap-2 px-4 py-2 text-[#1a73e8] bg-[#f6f9fe] rounded hover:bg-[#e8f0fe]"
                onClick={() => setShowThemeSelector(true)}
              >
                <Image size={18} />
                Select photo
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 text-[#1a73e8] bg-[#f6f9fe] rounded hover:bg-[#e8f0fe]"
              >
                <Upload size={18} />
                Upload photo
              </button>
            </div>
          </div>

          {/* Color Selection */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm text-[#3c4043] mb-4">Select theme color</p>
            <div className="flex gap-4">
              {themeColors.map((theme) => (
                <button
                  key={theme.id}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    selectedColor === theme.color ? 'ring-2 ring-offset-2 ring-[#1a73e8] scale-110' : ''
                  }`}
                  style={{ backgroundColor: theme.color }}
                  onClick={() => setSelectedColor(theme.color)}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 p-6 bg-gray-50 rounded-b-lg">
            <button
              className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6f9fe] rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 text-[#1a73e8] hover:bg-[#f6f9fe] rounded"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 