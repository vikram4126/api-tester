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
    <div className="flex flex-col border border-border/50 rounded-xl overflow-hidden bg-card/30 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-px bg-white/5 border-b border-border/50 text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">
        <div className="p-3 pl-5">Param Key</div>
        <div className="p-3 border-l border-border/50">Param Value</div>
        <div className="p-3 border-l border-border/50 text-center"></div>
      </div>

      
      {entries.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-px bg-background/20 border-b border-border/30 focus-within:ring-2 focus-within:ring-primary/20 focus-within:relative z-10 transition-all">
          <input 
            value={k}
            onChange={(e) => updateKey(k, e.target.value, v)}
            placeholder="Key"
            className="p-3 pl-5 text-[13px] focus:outline-none focus:bg-primary/5 text-foreground bg-transparent font-mono placeholder:text-muted-foreground/10"
          />
          <input 
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            placeholder="Value"
            className="p-3 text-[13px] focus:outline-none focus:bg-primary/5 text-foreground bg-transparent font-mono border-l border-border/30 placeholder:text-muted-foreground/10"
          />
          <button 
            onClick={() => removeRow(k)}
            className="flex items-center justify-center hover:bg-destructive/10 text-muted-foreground/40 hover:text-destructive transition-all border-l border-border/30"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      ))}

      <div className="grid grid-cols-[1fr_1fr_40px] gap-px bg-primary/5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:relative z-10 transition-all">
        <input 
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="New Key..."
          className="p-3 pl-5 text-[13px] focus:outline-none focus:bg-primary/10 text-primary font-mono placeholder:text-primary/20"
        />
        <input 
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="New Value..."
          className="p-3 text-[13px] focus:outline-none focus:bg-primary/10 text-primary font-mono border-l border-border/30 placeholder:text-primary/20"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all border-l border-border/30"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
