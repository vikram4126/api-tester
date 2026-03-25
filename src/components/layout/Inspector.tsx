import { Copy, Clock, Database } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useApiExecutor } from '@/hooks/useApiExecutor';
import { CodeEditor } from '@/components/ui/CodeEditor';

export function Inspector() {
  const activeRequestId = useAppStore(state => state.activeRequestId);
  const { data, isFetching, error } = useApiExecutor();

  if (!activeRequestId) {
    return (
      <div className="w-[450px] min-w-[300px] h-full bg-card border-l border-border flex flex-col items-center justify-center text-muted-foreground p-6 text-center text-sm">
        Select a request to view its response
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="w-[450px] min-w-[300px] h-full bg-card border-l border-border flex flex-col items-center justify-center text-muted-foreground">
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm">Sending Request...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[450px] min-w-[300px] h-full bg-card border-l border-border flex flex-col items-center justify-center text-destructive p-4">
        <p className="font-semibold mb-2">Error</p>
        <p className="text-sm text-center break-words w-full">{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="w-[450px] min-w-[300px] h-full bg-card border-l border-border flex flex-col items-center justify-center text-muted-foreground text-sm p-4 text-center">
        Enter the URL and click Send to get a response
      </div>
    );
  }

  const isJSON = typeof data.data === 'object';
  const valString = isJSON ? JSON.stringify(data.data, null, 2) : String(data.data);
  const isOk = data.status >= 200 && data.status < 300;

  return (
    <div className="w-80 h-full border-l border-border/50 bg-secondary/30 backdrop-blur-xl flex flex-col z-20">
      <div className="p-4 border-b border-border/50 flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Response</h3>
          <div className={`flex items-center gap-2 text-xs font-mono font-medium px-2 py-0.5 rounded-full ring-1 ${isOk ? 'text-emerald-500 bg-emerald-500/10 ring-emerald-500/20' : 'text-destructive bg-destructive/10 ring-destructive/20'}`}>
            {data.status} {data.statusText}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground p-3">
          <div className="flex items-center gap-1" title="Time to first byte">
            <Clock className="w-3.5 h-3.5" />
            <span>{data.time} ms</span>
          </div>
          <div className="flex items-center gap-1" title="Payload size">
            <Database className="w-3.5 h-3.5" />
            <span>{(data.size / 1024).toFixed(2)} KB</span>
          </div>
        </div>
      </div>
      
      {/* Response Tabs */}
      <div className="flex items-center gap-4 px-3 border-b border-border bg-card text-xs">
        <button className="py-2 px-1 border-b-2 border-primary text-foreground font-medium">Body</button>
        <button className="py-2 px-1 border-b-2 border-transparent text-muted-foreground hover:text-foreground">Headers ({Object.keys(data.headers || {}).length})</button>
      </div>

      <div className="p-2 border-b border-border bg-muted/30 flex items-center justify-between">
        <select className="bg-transparent text-xs text-muted-foreground focus:outline-none font-medium appearance-none pointer-events-none">
          <option>{isJSON ? 'JSON' : 'Text'}</option>
        </select>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted" title="Copy to clipboard" onClick={() => navigator.clipboard.writeText(valString)}>
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden relative">
         <CodeEditor value={valString} language={isJSON ? 'json' : 'plaintext'} readOnly={true} />
      </div>
    </div>
  );
}
