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
    <div className="flex flex-col gap-4 p-5 border border-border rounded-md bg-card shadow-sm">
      <div className="flex flex-col gap-1.5 max-w-sm">
        <label className="text-sm font-semibold text-foreground">Auth Type</label>
        <select className="bg-background border border-input rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring w-full cursor-pointer hover:border-border">
          <option value="bearer">Bearer Token</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 mt-2 max-w-xl">
        <label className="text-sm font-semibold text-foreground">Token</label>
        <input 
          type="text" 
          value={token}
          onChange={(e) => handleTokenChange(e.target.value)}
          placeholder="Enter token..."
          className="bg-background border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring font-mono transition-shadow hover:border-border"
        />
        <p className="text-xs text-muted-foreground mt-2 font-medium">
          Passing a token here will automatically inject an <code>Authorization: Bearer &lt;token&gt;</code> header into your request.
        </p>
      </div>
    </div>
  );
}
