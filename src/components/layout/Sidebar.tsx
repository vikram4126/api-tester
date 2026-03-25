import { useAppStore } from '@/store/useAppStore';
import { Plus, Folder, LayoutGrid, Settings } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';

export function Sidebar() {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const { activeRequestId, setActiveIds } = useAppStore(state => state);

  const collections = useLiveQuery(() => db.collections.toArray()) || [];
  const requests = useLiveQuery(() => db.requests.toArray()) || [];

  const handleCreateCollection = async () => {
    const colId = crypto.randomUUID();
    await db.collections.add({
      id: colId,
      workspaceId: 'default',
      parentId: null,
      name: 'New Collection'
    });
    
    const reqId = crypto.randomUUID();
    await db.requests.add({
      id: reqId,
      collectionId: colId,
      name: 'New Request',
      method: 'GET',
      url: 'https://jsonplaceholder.typicode.com/todos/1',
      headers: {},
      params: {},
      body: { type: 'none', content: '' }
    });
    
    setActiveIds(colId, reqId);
  };

  return (
    <div className="w-64 h-full bg-secondary/30 backdrop-blur-xl border-r border-border/50 flex flex-col z-20">
      <div className="p-4 border-b border-border/50 flex items-center justify-between shadow-sm">
        <div className="font-semibold text-sm flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-primary" />
          <span>Smart Request</span>
        </div>
        <button onClick={toggleTheme} className="text-muted-foreground hover:text-foreground transition-colors">
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-2 flex items-center justify-between">
          <span>Collections</span>
          <button onClick={handleCreateCollection} className="hover:text-foreground transition-colors"><Plus className="w-3 h-3" /></button>
        </div>
        
        {collections.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground mt-10">
            <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p>No collections yet</p>
            <button onClick={handleCreateCollection} className="mt-4 text-primary text-xs hover:underline">Create Collection</button>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {collections.map(col => (
              <div key={col.id} className="text-sm">
                <div className="px-2 py-1.5 flex items-center gap-2 text-foreground font-medium hover:bg-muted rounded-md cursor-pointer transition-colors">
                  <Folder className="w-4 h-4 text-primary/70" />
                  {col.name}
                </div>
                <div className="pl-6 space-y-1 mt-1">
                  {requests.filter(r => r.collectionId === col.id).map(req => (
                     <div 
                        key={req.id} 
                        onClick={() => setActiveIds(col.id, req.id)}
                        className={`px-2 py-1.5 flex items-center gap-2 rounded-md cursor-pointer text-[13px] transition-colors ${activeRequestId === req.id ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                     >
                       <span className={`text-[10px] font-bold ${req.method === 'GET' ? 'text-green-500' : req.method === 'POST' ? 'text-yellow-500' : 'text-blue-500'}`}>
                         {req.method}
                       </span>
                       <span className="truncate">{req.name}</span>
                     </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-border mt-auto">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full p-2 rounded-md hover:bg-accent transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
