import { Play } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RequestItem } from '@/lib/db';
import { useApiExecutor } from '@/hooks/useApiExecutor';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { SnippetGenerator } from '@/components/request/SnippetGenerator';
import { KeyValueEditor } from '@/components/request/KeyValueEditor';
import { AuthEditor } from '@/components/request/AuthEditor';
import { useState } from 'react';
import { motion } from 'framer-motion';

export function Workbench() {
  const activeRequestId = useAppStore(state => state.activeRequestId);
  
  const request = useLiveQuery(
    async () => activeRequestId ? await db.requests.get(activeRequestId) : null,
    [activeRequestId]
  ) as RequestItem | undefined | null;
  
  const [activeTab, setActiveTab] = useState<'params'|'headers'|'auth'|'body'|'snippets'>('params');
  const { refetch, isFetching } = useApiExecutor();

  const handleSend = () => {
    if (activeRequestId) refetch();
  };

  const updateUrl = (url: string) => {
    if (activeRequestId) db.requests.update(activeRequestId, { url });
  };

  const updateMethod = (method: string) => {
    if (activeRequestId) db.requests.update(activeRequestId, { method });
  };

  const updateBody = (content: string | undefined) => {
    if (activeRequestId && content !== undefined) {
      db.requests.update(activeRequestId, { body: { type: request?.body.type || 'json', content } });
    }
  };

  if (!request) {
    return (
      <div className="flex flex-col h-full bg-background items-center justify-center text-muted-foreground">
        Select a request from the sidebar or create a new one.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* URL BAR */}
      <div className="flex items-center gap-4 p-6 border-b border-border/50 bg-card/10 backdrop-blur-md z-10">
        <div className="flex-1 flex items-center gap-0 bg-secondary/30 rounded-xl border border-border/50 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10 transition-all overflow-hidden group shadow-inner">
          <select 
            className="bg-transparent text-primary text-[11px] font-black uppercase tracking-wider rounded-none px-5 py-3 focus:outline-none cursor-pointer hover:bg-white/5 transition-all border-r border-border/50"
            value={request.method}
            onChange={(e) => updateMethod(e.target.value)}
          >
            <option>GET</option>
            <option>POST</option>
            <option>PUT</option>
            <option>DELETE</option>
            <option>PATCH</option>
          </select>
          <input 
            type="text" 
            placeholder="https://api.example.com/v1/users"
            className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-foreground font-mono placeholder:text-muted-foreground/20 selection:bg-primary/30"
            value={request.url}
            onChange={(e) => updateUrl(e.target.value)}
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02, translateY: -1 }}
          whileTap={{ scale: 0.98, translateY: 0 }}
          onClick={handleSend}
          disabled={isFetching}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-[0.15em] w-[180px] py-3 rounded-xl flex items-center justify-center gap-3 text-[11px] transition-all shadow-xl shadow-primary/20 disabled:opacity-50 h-[46px] border border-primary/20 shrink-0"
        >
          {isFetching ? (
            <div className="animate-spin w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current" />
          )}
          <span>{isFetching ? 'Sending...' : 'Send Request'}</span>
        </motion.button>

      </div>


      {/* TABS */}
      <div className="flex items-center gap-8 px-8 border-b border-border/50 bg-card/5 text-[11px] font-black uppercase tracking-widest overflow-x-auto no-scrollbar">
        {(['params', 'headers', 'auth', 'body', 'snippets'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-4 px-1 border-b-2 transition-all relative whitespace-nowrap ${
              activeTab === tab 
                ? 'border-primary text-primary' 
                : 'border-transparent text-muted-foreground/40 hover:text-foreground'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <motion.div 
                layoutId="activeTab"
                className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-primary shadow-[0_0_12px_rgba(0,174,239,0.8)] rounded-full"
              />
            )}
          </button>
        ))}
      </div>


      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col z-0">
        {activeTab === 'body' && (
          <div className="flex-1 border border-border rounded-md overflow-hidden bg-card flex flex-col shadow-sm">
            <div className="p-2 border-b border-border bg-muted/30 flex items-center">
              <select 
                className="bg-transparent text-xs text-foreground focus:outline-none font-medium cursor-pointer border border-border rounded px-2 py-1"
                value={request.body.type}
                onChange={(e) => {
                  if (activeRequestId) db.requests.update(activeRequestId, { body: { ...request.body, type: e.target.value as any } });
                }}
              >
                <option value="none">None</option>
                <option value="json">JSON</option>
                <option value="raw">Raw</option>
              </select>
            </div>
            {request.body.type !== 'none' ? (
              <CodeEditor 
                value={request.body.content} 
                onChange={updateBody} 
                language={request.body.type === 'json' ? 'json' : 'plaintext'} 
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                This request does not have a body
              </div>
            )}
          </div>
        )}

        {activeTab === 'params' && (
          <KeyValueEditor 
            items={request.params || {}} 
            onChange={(params) => db.requests.update(request.id, { params })} 
          />
        )}
        
        {activeTab === 'headers' && (
          <KeyValueEditor 
            items={request.headers || {}} 
            onChange={(headers) => db.requests.update(request.id, { headers })} 
          />
        )}

        {activeTab === 'auth' && (
          <AuthEditor 
            headers={request.headers || {}} 
            onChange={(headers) => db.requests.update(request.id, { headers })} 
          />
        )}

        {activeTab === 'snippets' && (
          <SnippetGenerator />
        )}
      </div>
    </div>
  );
}
