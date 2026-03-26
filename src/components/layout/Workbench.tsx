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
      <div className="flex items-center gap-2 p-3 border-b border-border/50 bg-background/80 backdrop-blur-md shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] z-10">
        <select 
          className="bg-accent text-accent-foreground text-sm font-medium rounded-md px-3 py-1.5 focus:outline-none border border-transparent hover:border-border cursor-pointer"
          value={request.method}
          onChange={(e) => updateMethod(e.target.value)}
        >
          <option>GET</option>
          <option>POST</option>
          <option>PUT</option>
          <option>DELETE</option>
          <option>PATCH</option>
        </select>
        <div className="flex-1 flex rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-ring focus-within:border-ring overflow-hidden">
          <input 
            type="text" 
            placeholder="https://api.example.com/v1/users"
            className="flex-1 bg-transparent px-3 py-1.5 text-sm focus:outline-none text-foreground font-mono"
            value={request.url}
            onChange={(e) => updateUrl(e.target.value)}
          />
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={isFetching}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-1.5 rounded-md flex items-center gap-2 text-sm transition-all shadow-sm disabled:opacity-50"
        >
          <span>{isFetching ? 'Sending...' : 'Send'}</span>
          {!isFetching && <Play className="w-3.5 h-3.5 fill-current" />}
        </motion.button>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-4 px-4 border-b border-border bg-card text-sm">
        {(['params', 'headers', 'auth', 'body', 'snippets'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2.5 px-1 border-b-2 font-medium capitalize transition-colors ${
              activeTab === tab 
                ? 'border-primary text-foreground' 
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-4 flex flex-col z-0">
        {activeTab === 'body' && (
          <div className="flex-1 border border-border rounded-md overflow-hidden bg-card flex flex-col shadow-sm">
            <div className="p-2 border-b border-border bg-muted/30 flex items-center">
              <select 
                className="bg-transparent text-xs text-muted-foreground focus:outline-none font-medium appearance-none cursor-pointer"
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
