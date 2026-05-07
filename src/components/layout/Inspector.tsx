import { Copy, Clock, Database } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useApiExecutor } from '@/hooks/useApiExecutor';
import { CodeEditor } from '@/components/ui/CodeEditor';

export function Inspector() {
  const activeRequestId = useAppStore(state => state.activeRequestId);
  const { data, isFetching, error } = useApiExecutor();
  const [activeTab, setActiveTab] = useState<'body' | 'headers'>('body');

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
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-none mb-4"></div>
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
  const headersString = data.headers ? JSON.stringify(data.headers, null, 2) : '{}';
  const isOk = data.status >= 200 && data.status < 300;

  return (
    <div className="w-[450px] h-full border-l border-border/50 bg-card/40 backdrop-blur-3xl flex flex-col z-20 relative overflow-hidden">

      {/* Decorative gradient blur */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-none pointer-events-none" />
      

      <div className="p-8 border-b border-border/50 flex flex-col gap-6 bg-card/30 relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-[13px] text-muted-foreground/60">Response Data</h3>
          <div className={`flex items-center gap-2.5 text-[11px] font-bold px-4 py-1.5 rounded-xl border ${
            isOk 
              ? 'text-emerald-400 bg-emerald-400/5 border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.1)]' 
              : 'text-destructive bg-destructive/5 border-destructive/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isOk ? 'bg-emerald-400' : 'bg-destructive'} animate-pulse`} />
            {data.status} {data.statusText}
          </div>
        </div>
        <div className="flex items-center gap-8 text-xs font-bold text-muted-foreground/60">
          <div className="flex items-center gap-2" title="Time to first byte">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <Clock className="w-3.5 h-3.5 text-primary" />
            </div>
            <span>{data.time} ms</span>
          </div>
          <div className="flex items-center gap-2" title="Payload size">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <Database className="w-3.5 h-3.5 text-primary" />
            </div>
            <span>{(data.size / 1024).toFixed(2)} KB</span>
          </div>
        </div>
      </div>

      
      {/* Response Tabs */}
      <div className="flex items-center gap-8 px-8 border-b border-border/50 bg-secondary/10 dark:bg-slate-900 text-xs font-bold relative z-10 shadow-inner transition-colors">
        <button 
          onClick={() => setActiveTab('body')}
          className={`py-4 px-1 border-b-2 ${activeTab === 'body' ? 'border-primary text-primary dark:text-white relative' : 'border-transparent text-muted-foreground dark:text-white/50 hover:text-foreground dark:hover:text-white'}`}>
          Body
          {activeTab === 'body' && <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_12px_rgba(0,51,141,0.8)] rounded-none" />}
        </button>
        <button 
          onClick={() => setActiveTab('headers')}
          className={`py-4 px-1 border-b-2 ${activeTab === 'headers' ? 'border-primary text-primary dark:text-white relative' : 'border-transparent text-muted-foreground dark:text-white/50 hover:text-foreground dark:hover:text-white'}`}>
          Headers ({Object.keys(data.headers || {}).length})
          {activeTab === 'headers' && <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_12px_rgba(0,51,141,0.8)] rounded-none" />}
        </button>
      </div>


      <div className="p-3 border-b border-border/50 bg-muted/20 flex items-center justify-between relative z-10 px-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary/40" />
          <span className="text-[11px] font-bold text-muted-foreground/60">{activeTab === 'body' ? (isJSON ? 'JSON Output' : 'Plain Text') : 'Headers'}</span>
        </div>
        <button 
          className="text-muted-foreground hover:text-primary p-2 rounded-lg hover:bg-primary/10 transition-all border border-transparent hover:border-primary/20 shadow-sm hover:shadow-primary/10" 
          title="Copy to clipboard" 
          onClick={() => navigator.clipboard.writeText(activeTab === 'body' ? valString : headersString)}
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>


      <div className="flex-1 overflow-hidden relative">
         <CodeEditor 
            value={activeTab === 'body' ? valString : headersString} 
            language={activeTab === 'body' ? (isJSON ? 'json' : 'plaintext') : 'json'} 
            readOnly={true} 
         />
      </div>
    </div>
  );
}
