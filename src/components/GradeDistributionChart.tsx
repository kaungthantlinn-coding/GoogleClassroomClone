import React, { useEffect, useState } from 'react';

interface GradeRange {
  label: string;
  count: number;
  min: number;
  max: number;
}

interface GradeDistributionChartProps {
  data: GradeRange[];
  className?: string;
}

const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({ 
  data, 
  className = "" 
}) => {
  const maxCount = Math.max(...data.map(r => r.count), 1);
  const [animated, setAnimated] = useState(false);
  
  // Animation effect when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);
  
  // Get color based on grade range
  const getBarColor = (min: number, max: number) => {
    // Color scheme based on grade ranges
    if (min >= 90) return 'from-emerald-400 to-emerald-600'; // A grade (90-100)
    if (min >= 80) return 'from-green-400 to-green-600';     // B grade (80-89)
    if (min >= 70) return 'from-blue-400 to-blue-600';       // C grade (70-79)
    if (min >= 60) return 'from-yellow-400 to-yellow-600';   // D grade (60-69)
    return 'from-red-400 to-red-600';                        // F grade (0-59)
  };
  
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex gap-4">
        <div className="flex flex-col justify-between py-2">
          <span className="text-sm text-muted-foreground font-medium">4</span>
          <span className="text-sm text-muted-foreground font-medium">3</span>
          <span className="text-sm text-muted-foreground font-medium">2</span>
          <span className="text-sm text-muted-foreground font-medium">1</span>
          <span className="text-sm text-muted-foreground font-medium">0</span>
        </div>
        
        <div className="flex-1 flex items-end gap-2 h-[200px]">
          {data.map((range, i) => {
            const height = range.count > 0 
              ? Math.max((range.count / maxCount) * 100, 10) 
              : 0;
            
            return (
              <div key={i} className="flex flex-col items-center flex-1 group">
                <div 
                  className={`w-full bg-gradient-to-t ${getBarColor(range.min, range.max)} rounded-t shadow-md transition-all duration-700 ease-out relative overflow-hidden ${animated ? '' : 'opacity-0'}`}
                  style={{ 
                    height: `${animated ? height : 0}%`, 
                    minHeight: range.count > 0 ? '10px' : '0',
                    transitionDelay: `${i * 50}ms`
                  }}
                >
                  {range.count > 0 && (
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  )}
                  {range.count > 0 && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 pointer-events-none">
                      {range.count}
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-center whitespace-nowrap overflow-hidden text-ellipsis w-full font-medium">
                  {range.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GradeDistributionChart;