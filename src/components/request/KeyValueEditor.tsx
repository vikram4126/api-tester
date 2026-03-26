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
    <div className="flex flex-col border border-border rounded-md overflow-hidden bg-card shadow-sm">
      <div className="grid grid-cols-[1fr_1fr_40px] gap-px bg-muted/50 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="p-2 pl-3">Key</div>
        <div className="p-2 border-l border-border/50">Value</div>
        <div className="p-2 border-l border-border/50 text-center"></div>
      </div>
      
      {entries.map(([k, v], i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_40px] gap-px bg-background border-b border-border/50 focus-within:ring-1 focus-within:ring-ring focus-within:relative z-10 transition-shadow">
          <input 
            value={k}
            onChange={(e) => updateKey(k, e.target.value, v)}
            placeholder="Key"
            className="p-2 pl-3 text-sm focus:outline-none focus:bg-accent/30 text-foreground bg-transparent font-mono"
          />
          <input 
            value={v}
            onChange={(e) => updateValue(k, e.target.value)}
            placeholder="Value"
            className="p-2 text-sm focus:outline-none focus:bg-accent/30 text-foreground bg-transparent font-mono border-l border-border/50"
          />
          <button 
            onClick={() => removeRow(k)}
            className="flex items-center justify-center hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors border-l border-border/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}

      <div className="grid grid-cols-[1fr_1fr_40px] gap-px bg-background/50 focus-within:ring-1 focus-within:ring-ring focus-within:relative z-10 transition-shadow">
        <input 
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder="New Key"
          className="p-2 pl-3 text-sm focus:outline-none focus:bg-accent/30 text-muted-foreground focus:text-foreground bg-transparent font-mono"
        />
        <input 
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
          className="p-2 text-sm focus:outline-none focus:bg-accent/30 text-muted-foreground focus:text-foreground bg-transparent font-mono border-l border-border/50"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <button 
          onClick={handleAdd}
          className="flex items-center justify-center hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors border-l border-border/50"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
