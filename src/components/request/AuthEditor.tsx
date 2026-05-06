interface AuthEditorProps {
  headers: Record<string, string>;
  onChange: (headers: Record<string, string>) => void;
}

export function AuthEditor({ headers, onChange }: AuthEditorProps) {
  const authHeader = headers['Authorization'] || '';
  const isBearer = authHeader.startsWith('Bearer ');
  const token = isBearer ? authHeader.replace('Bearer ', '') : '';

  const handleTokenChange = (newToken: string) => {
    if (newToken.trim()) {
      onChange({ ...headers, 'Authorization': `Bearer ${newToken.trim()}` });
    } else {
      const newHeaders = { ...headers };
      delete newHeaders['Authorization'];
      onChange(newHeaders);
    }
  };

  return (
    <div className="flex flex-col gap-8 p-8 border border-border/50 rounded-xl bg-card/30 backdrop-blur-md shadow-lg shadow-black/20">
      <div className="flex flex-col gap-3 max-w-sm">
        <label className="text-[11px] font-bold text-muted-foreground/60">Auth Type</label>
        <div className="relative group">
          <select className="bg-secondary/50 border border-border rounded-xl px-4 py-2.5 text-[11px] font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary w-full cursor-pointer appearance-none transition-all hover:bg-secondary/70">
            <option value="bearer">Bearer Token</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/30">
            ▼
          </div>
        </div>
      </div>


      <div className="flex flex-col gap-3 max-w-2xl">
        <label className="text-[11px] font-bold text-muted-foreground/60">Access Token</label>
        <input 
          type="text" 
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          placeholder="Enter your token here..."
          className="bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary font-mono transition-all hover:bg-secondary/70 placeholder:text-muted-foreground/50 text-primary"
        />
        <div className="flex items-center gap-2 mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="w-1 h-1 rounded-full bg-primary" />
          <p className="text-[11px] text-muted-foreground font-semibold">
            Injected as <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> header.
          </p>
        </div>
      </div>

    </div>
  );
}
