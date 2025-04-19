import * as React from "react";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface BreadcrumbProps {
  items: {
    label: string;
    href?: string;
  }[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items,
  className = ""
}) => {
  return (
    <nav className={`flex items-center text-sm ${className}`}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <React.Fragment key={index}>
              <li className="flex items-center">
                {item.href ? (
                  <Link 
                    to={item.href} 
                    className="text-[#1a73e8] hover:text-[#1558c4]"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "font-medium text-gray-800" : "text-[#1a73e8]"}>
                    {item.label}
                  </span>
                )}
              </li>
              
              {!isLast && (
                <li className="text-gray-500 mx-1">
                  &gt;
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}; 