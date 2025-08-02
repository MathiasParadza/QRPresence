import { jsx as _jsx } from "react/jsx-runtime";
import * as React from 'react';
import { cn } from '@/lib/utils';
export function Tabs({ defaultValue, value, onValueChange, children, className }) {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const activeTab = isControlled ? value : internalValue;
    const handleValueChange = React.useCallback((newValue) => {
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
    return (_jsx("div", { className: cn('w-full', className), children: _jsx(TabsContext.Provider, { value: contextValue, children: children }) }));
}
const TabsContext = React.createContext({});
// ---------- TabsList ----------
export const TabsList = ({ children, className }) => {
    return (_jsx("div", { className: cn('flex space-x-2 border-b border-gray-200 mb-4', className), children: children }));
};
export const TabsTrigger = ({ value, children, className, ...props }) => {
    const { activeTab, setActiveTab } = React.useContext(TabsContext);
    return (_jsx("button", { ...props, onClick: () => setActiveTab?.(value), className: cn('px-4 py-2 text-sm font-medium rounded-t border-b-2 transition-all', activeTab === value
            ? 'text-purple-600 border-purple-600 bg-white'
            : 'text-gray-500 border-transparent hover:text-purple-600', className), children: children }));
};
export const TabsContent = ({ value, children }) => {
    const { activeTab } = React.useContext(TabsContext);
    return activeTab === value ? _jsx("div", { className: "mt-2", children: children }) : null;
};
