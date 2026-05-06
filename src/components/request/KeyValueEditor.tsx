import { X, Plus } from 'lucide-react';
import { useState } from 'react';

interface KeyValueEditorProps {
  items: Record<string, string>;
  onChange: (items: Record<string, string>) => void;
}

export function KeyValueEditor({ items, onChange }: KeyValueEditorProps) {
  const entries = Object.entries(items || {});
  
  const updateKey = (oldKey: string, newKey: string, value: string) => {
    const newItems = { ...items };
    delete newItems[oldKey];
    if (newKey) newItems[newKey] = value;
    onChange(newItems);
  };

  const updateValue = (key: string, newValue: string) => {
    onChange({ ...items, [key]: newValue });
  };

  const removeRow = (key: string) => {
    const newItems = { ...items };
    delete newItems[key];
    onChange(newItems);
  };

  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (newKey) {
      onChange({ ...items, [newKey]: newValue });
      setNewKey('');
      setNewValue('');
    }
  };

  return (
    <div className="flex flex-col border border-border/50 rounded-none overflow-hidden bg-card/30 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-px bg-slate-100 dark:bg-slate-900 border-b border-border/50 text-xs font-bold text-slate-600 dark:text-white shadow-sm">
        <div className="p-3 pl-5 border-r border-border/50 dark:border-white/10">Param Key</div>
        <div className="p-3 border-r border-border/50 dark:border-white/10">Param Value</div>
        <div className="p-3 text-center"></div>
      </div>

      
      <div className="flex flex-col p-2 space-y-2">
        {entries.map(([k, v], i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center">
            <div className="relative group">
              <input 
                value={k}
                onChange={(e) => updateKey(k, e.target.value, v)}
                placeholder="Key"
                className="w-full p-2.5 pl-4 text-[13px] bg-secondary/50 border border-border hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-none transition-all outline-none text-foreground font-mono placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="relative group">
              <input 
                value={v}
                onChange={(e) => updateValue(k, e.target.value)}
                placeholder="Value"
                className="w-full p-2.5 pl-4 text-[13px] bg-secondary/50 border border-border hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-none transition-all outline-none text-foreground font-mono placeholder:text-muted-foreground/50"
              />
            </div>
            <button 
              onClick={() => removeRow(k)}
              className="w-10 h-10 flex items-center justify-center bg-secondary/30 hover:bg-destructive/10 text-muted-foreground/60 hover:text-destructive transition-all rounded-none border border-border hover:border-destructive/20"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        <div className="grid grid-cols-[1fr_1fr_40px] gap-2 items-center pt-2 border-t border-border/50">
          <input 
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="New Key..."
            className="w-full p-2.5 pl-4 text-[13px] bg-primary/5 border border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-none transition-all outline-none text-primary font-mono placeholder:text-primary/40"
          />
          <input 
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="New Value..."
            className="w-full p-2.5 pl-4 text-[13px] bg-primary/5 border border-primary/20 hover:border-primary/40 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-none transition-all outline-none text-primary font-mono placeholder:text-primary/40"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button 
            onClick={handleAdd}
            className="w-10 h-10 flex items-center justify-center bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all rounded-none border border-primary/20 shadow-sm"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
