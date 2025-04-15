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
      id: 'general_1',
      url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1a73e8'
    },
    {
      id: 'general_2',
      url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1e8e3e'
    },
    {
      id: 'general_3',
      url: 'https://images.unsplash.com/photo-1606761568499-6d2451b23c66?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#d93025'
    },
    {
      id: 'general_4',
      url: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#4285f4'
    }
  ],
  'english-history': [
    {
      id: 'english_1',
      url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1a73e8'
    },
    {
      id: 'english_2',
      url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1e8e3e'
    },
    {
      id: 'english_3',
      url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#d93025'
    },
    {
      id: 'english_4',
      url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#4285f4'
    }
  ],
  'math-science': [
    {
      id: 'math_1',
      url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1a73e8'
    },
    {
      id: 'math_2',
      url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1e8e3e'
    },
    {
      id: 'math_3',
      url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#d93025'
    },
    {
      id: 'math_4',
      url: 'https://images.unsplash.com/photo-1453733190371-0a9bedd82893?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#4285f4'
    }
  ],
  'arts': [
    {
      id: 'arts_1',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#d93025'
    },
    {
      id: 'arts_2',
      url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1a73e8'
    },
    {
      id: 'arts_3',
      url: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1e8e3e'
    },
    {
      id: 'arts_4',
      url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#4285f4'
    }
  ],
  'sports': [
    {
      id: 'sports_1',
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1a73e8'
    },
    {
      id: 'sports_2',
      url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1e8e3e'
    },
    {
      id: 'sports_3',
      url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#d93025'
    },
    {
      id: 'sports_4',
      url: 'https://images.unsplash.com/photo-1576858574144-9ae1ebcf5ae5?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#4285f4'
    }
  ],
  'other': [
    {
      id: 'other_1',
      url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1a73e8'
    },
    {
      id: 'other_2',
      url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#1e8e3e'
    },
    {
      id: 'other_3',
      url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#d93025'
    },
    {
      id: 'other_4',
      url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=1600&h=900&q=80',
      color: '#4285f4'
    }
  ]
};

export default function ThemeCustomizer({ isOpen, onClose, onSave, currentTheme }: ThemeCustomizerProps) {
  const [selectedColor, setSelectedColor] = useState(currentTheme?.color || themeColors[0].color);
  const [selectedImage, setSelectedImage] = useState(currentTheme?.image || defaultThemeImages.general[0].url);
  const [activeCategory, setActiveCategory] = useState('general');
  const [showThemeSelector, setShowThemeSelector] = useState(false);

  // Add timestamp to force image refresh
  const getRandomImageUrl = (url: string) => {
    return `${url}&t=${Date.now()}`;
  };

  const handleSave = () => {
    onSave({ color: selectedColor, image: selectedImage });
    onClose();
  };

  const handleThemeSelect = (image: string, color: string) => {
    setSelectedImage(getRandomImageUrl(image));
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
              <div className="grid grid-cols-2 gap-4 mb-6">
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
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
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