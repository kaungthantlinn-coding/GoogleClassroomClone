import * as React from "react";

interface SliderProps {
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  value: number[];
  onValueChange: (values: number[]) => void;
}

const Slider: React.FC<SliderProps> = ({
  className = "",
  min = 0,
  max = 100,
  step = 1,
  value,
  onValueChange,
}) => {
  const trackRef = React.useRef<HTMLDivElement>(null);
  
  const handleSliderChange = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    
    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const offsetX = e.clientX - trackRect.left;
    const percentage = Math.min(Math.max(offsetX / trackRect.width, 0), 1);
    const newValue = Math.round((percentage * (max - min) + min) / step) * step;
    
    onValueChange([newValue]);
  };

  const percentage = ((value[0] - min) / (max - min)) * 100;

  return (
    <div 
      className={`relative w-full h-5 flex items-center ${className}`}
      onClick={handleSliderChange}
      ref={trackRef}
    >
      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div 
          className="h-full bg-blue-500 rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div 
        className="absolute h-4 w-4 rounded-full bg-blue-500 shadow transform -translate-x-1/2"
        style={{ left: `${percentage}%` }}
      />
    </div>
  );
};

export { Slider }; 