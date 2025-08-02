import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabsProps {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  
  const activeTab = isControlled ? value : internalValue;

  const handleValueChange = React.useCallback((newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    if (onValueChange) {
      onValueChange(newValue);
    }
  }, [isControlled, onValueChange]);

  const contextValue = React.useMemo(() => ({ 
    activeTab, 
    setActiveTab: handleValueChange 
  }), [activeTab, handleValueChange]);

  return (
    <div className={cn('w-full', className)}>
      <TabsContext.Provider value={contextValue}>
        {children}
      </TabsContext.Provider>
    </div>
  );
}

// ---------- Context ----------
type TabsContextType = {
  activeTab?: string;
  setActiveTab?: (val: string) => void;
};

const TabsContext = React.createContext<TabsContextType>({});

// ---------- TabsList ----------
export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn('flex space-x-2 border-b border-gray-200 mb-4', className)}>
      {children}
    </div>
  );
};

// ---------- TabsTrigger ----------
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
  children: React.ReactNode;
}

export const TabsTrigger = ({ value, children, className, ...props }: TabsTriggerProps) => {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);

  return (
    <button
      {...props}
      onClick={() => setActiveTab?.(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-all',
        activeTab === value
          ? 'text-purple-600 border-purple-600 bg-white'
          : 'text-gray-500 border-transparent hover:text-purple-600',
        className
      )}
    >
      {children}
    </button>
  );
};

// ---------- TabsContent ----------
interface TabsContentProps {
  value: string;
  children: React.ReactNode;
}

export const TabsContent = ({ value, children }: TabsContentProps) => {
  const { activeTab } = React.useContext(TabsContext);
  return activeTab === value ? <div className="mt-2">{children}</div> : null;
};