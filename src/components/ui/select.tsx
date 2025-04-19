import * as React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
  className?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <select
        className={`h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);

Select.displayName = "Select";

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

const SelectTrigger: React.FC<SelectTriggerProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};

interface SelectValueProps {
  children: React.ReactNode;
  className?: string;
}

const SelectValue: React.FC<SelectValueProps> = ({ 
  children, 
  className = "" 
}) => {
  return <span className={className}>{children}</span>;
};

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

const SelectContent: React.FC<SelectContentProps> = ({ 
  children, 
  className = "" 
}) => {
  return (
    <div className={`bg-white rounded-md border border-input shadow-md ${className}`}>
      {children}
    </div>
  );
};

interface SelectItemProps {
  children: React.ReactNode;
  className?: string;
  value: string;
}

const SelectItem: React.FC<SelectItemProps> = ({ 
  children, 
  className = "",
  value 
}) => {
  return (
    <div className={`px-3 py-2 hover:bg-slate-100 cursor-pointer ${className}`} data-value={value}>
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }; 