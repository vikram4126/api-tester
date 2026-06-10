import { useAppStore } from '@/store/useAppStore';
import { Plus, Folder, LayoutGrid, Settings, Edit2, Trash2, Upload, Download, Database } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { toast } from 'sonner';

const MySwal = withReactContent(Swal);

export function Sidebar() {
  const theme = useAppStore(state => state.theme);
  const toggleTheme = useAppStore(state => state.toggleTheme);
  const { activeRequestId, activeCollectionId, setActiveIds } = useAppStore(state => state);

  const collections = useLiveQuery(() => db.collections.toArray()) || [];
  const requests = useLiveQuery(() => db.requests.toArray()) || [];

  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [editReqName, setEditReqName] = useState('');

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

  const handleAddRequest = async (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
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

  const handleExportCollection = async (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    const col = collections.find(c => c.id === colId);
    if (!col) return;
    const reqs = requests.filter(r => r.collectionId === colId);
    const data = { collection: col, requests: reqs };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${col.name.replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Collection exported');
  };

  const handleImportCollection = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          if (!data.collection || !data.requests) throw new Error('Invalid format');
          
          const newColId = crypto.randomUUID();
          await db.collections.add({
            ...data.collection,
            id: newColId,
            workspaceId: 'default',
          });

          const newReqs = data.requests.map((r: any) => ({
            ...r,
            id: crypto.randomUUID(),
            collectionId: newColId
          }));
          await db.requests.bulkAdd(newReqs);
          toast.success('Collection imported successfully');
        } catch (err) {
          toast.error('Failed to parse collection file');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadDummyData = async () => {
    const colId = crypto.randomUUID();
    await db.collections.add({
      id: colId,
      workspaceId: 'default',
      parentId: null,
      name: 'JSONPlaceholder API'
    });

    const reqs = [
      {
        id: crypto.randomUUID(), collectionId: colId, name: 'Get Posts', method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts', headers: {}, params: {}, body: { type: 'none', content: '' } as any
      },
      {
        id: crypto.randomUUID(), collectionId: colId, name: 'Create Post', method: 'POST',
        url: 'https://jsonplaceholder.typicode.com/posts', headers: {'Content-type': 'application/json; charset=UTF-8'}, params: {}, body: { type: 'json', content: '{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}' } as any
      },
      {
        id: crypto.randomUUID(), collectionId: colId, name: 'Get User', method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/users/1', headers: {}, params: {}, body: { type: 'none', content: '' } as any
      }
    ];
    await db.requests.bulkAdd(reqs);
    toast.success('Dummy collection added');
  };

  const saveEdit = async (colId: string) => {
    if (editName.trim()) {
      await db.collections.update(colId, { name: editName });
    }
    setEditingColId(null);
  };

  const saveReqEdit = async (reqId: string) => {
    if (editReqName.trim()) {
      await db.requests.update(reqId, { name: editReqName });
    }
    setEditingReqId(null);
  };

  const handleDeleteCollection = async (e: React.MouseEvent, colId: string) => {
    e.stopPropagation();
    
    const result = await MySwal.fire({
      title: 'Delete Collection?',
      text: "This will also delete all requests inside this collection.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it',
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      color: theme === 'dark' ? '#f8fafc' : '#0f172a'
    });

    if (result.isConfirmed) {
      await db.collections.delete(colId);
      const reqsToDelete = requests.filter(r => r.collectionId === colId).map(r => r.id);
      await db.requests.bulkDelete(reqsToDelete);
      if (activeCollectionId === colId) {
        setActiveIds(null, null);
      }
      toast.success('Collection deleted successfully');
    }
  };

  const handleDeleteRequest = async (e: React.MouseEvent, reqId: string) => {
    e.stopPropagation();
    
    const result = await MySwal.fire({
      title: 'Delete Request?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete it',
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      color: theme === 'dark' ? '#f8fafc' : '#0f172a'
    });

    if (result.isConfirmed) {
      await db.requests.delete(reqId);
      if (activeRequestId === reqId) {
        setActiveIds(activeCollectionId, null);
      }
      toast.success('Request deleted successfully');
    }
  };

  return (
    <div className="w-[280px] h-full bg-card/40 backdrop-blur-3xl border-r border-border flex flex-col z-20 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 blur-[100px] rounded-none pointer-events-none" />

      <div className="h-16 px-6 border-b border-border/50 flex items-center justify-between shrink-0 relative z-10">
        <div className="font-bold text-[13px] text-primary/80 flex items-center gap-2.5">
          <div className="w-5 h-5 bg-primary/10 rounded-none flex items-center justify-center border border-primary/20 shadow-[0_0_15px_rgba(0,51,141,0.1)]">
            <LayoutGrid className="w-3 h-3 text-primary" />
          </div>
          <span>Collections</span>
        </div>
        <button onClick={toggleTheme} className="w-9 h-9 flex items-center justify-center rounded-xl bg-secondary/30 hover:bg-secondary/60 text-muted-foreground border border-border/50 hover:border-border transition-all group">
          <span className="group-hover:scale-110 transition-transform">{theme === 'dark' ? '🌙' : '☀️'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="text-[11px] font-bold text-muted-foreground/60 mb-3 px-3 flex items-center justify-between">
            <span>Library</span>
            <div className="flex gap-2">
              <button onClick={handleImportCollection} className="hover:text-primary transition-colors" title="Import Collection"><Upload className="w-3.5 h-3.5" /></button>
              <button onClick={handleCreateCollection} className="hover:text-primary transition-colors" title="Create Collection"><Plus className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {collections.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground mt-10">
              <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No collections yet</p>
              <div className="flex flex-col gap-2 mt-4 items-center">
                <button onClick={handleCreateCollection} className="text-primary text-xs hover:underline flex items-center gap-1.5"><Plus className="w-3 h-3" /> Create Collection</button>
                <button onClick={handleImportCollection} className="text-primary text-xs hover:underline flex items-center gap-1.5"><Upload className="w-3 h-3" /> Import Collection</button>
                <button onClick={handleLoadDummyData} className="text-primary text-xs hover:underline flex items-center gap-1.5"><Database className="w-3 h-3" /> Load Dummy Data</button>
              </div>
            </div>
          ) : (
            <div className="space-y-1 mt-2">
              {collections.map(col => (
                <div key={col.id} className="text-sm group mb-2">
                  <div className="px-3 py-2 flex items-center justify-between text-foreground font-semibold hover:bg-accent rounded-none cursor-pointer transition-all border border-transparent hover:border-border">
                    <div className="flex items-center gap-2 flex-1">
                      <Folder className="w-4 h-4 text-primary/70" />
                      {editingColId === col.id ? (
                        <input
                          autoFocus
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => saveEdit(col.id)}
                          onKeyDown={e => e.key === 'Enter' && saveEdit(col.id)}
                          className="bg-background border border-primary/40 rounded-none px-2 py-0.5 text-sm outline-none w-[140px] focus:ring-2 focus:ring-primary/10 transition-all"
                        />
                      ) : (
                        <span className="truncate flex-1 max-w-[124px]">{col.name}</span>
                      )}
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                      <button
                        onClick={(e) => handleExportCollection(e, col.id)}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        title="Export Collection"
                      >
                        <Download className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setEditingColId(col.id); setEditName(col.name); }}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        title="Edit Collection"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteCollection(e, col.id)}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-destructive"
                        title="Delete Collection"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => handleAddRequest(e, col.id)}
                        className="p-1 hover:bg-background rounded text-muted-foreground hover:text-foreground"
                        title="Add Request"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="pl-6 space-y-1 mt-1 border-l border-border/40 ml-4">
                    {requests.filter(r => r.collectionId === col.id).map(req => (
                      <div
                        key={req.id}
                        onClick={() => setActiveIds(col.id, req.id)}
                        className={`group/req px-3 py-2 flex items-center gap-3 rounded-none cursor-pointer text-[13px] transition-all relative ${activeRequestId === req.id
                            ? 'bg-primary/10 text-primary font-bold border border-primary/20'
                            : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent'
                          }`}
                      >
                        <span className={`text-[11px] font-bold ${req.method === 'GET' ? 'text-green-500' : req.method === 'POST' ? 'text-yellow-500' : 'text-blue-500'}`}>
                          {req.method}
                        </span>

                        {editingReqId === req.id ? (
                          <input
                            autoFocus
                            value={editReqName}
                            onChange={e => setEditReqName(e.target.value)}
                            onBlur={() => saveReqEdit(req.id)}
                            onKeyDown={e => e.key === 'Enter' && saveReqEdit(req.id)}
                            className="bg-background border border-primary/40 text-foreground rounded-none px-2 py-0.5 text-xs outline-none w-[120px] focus:ring-2 focus:ring-primary/10 transition-all"
                          />
                        ) : (
                          <span className="truncate flex-1">{req.name}</span>
                        )}
                        <div className="opacity-0 group-hover/req:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingReqId(req.id); setEditReqName(req.name); }}
                            className="p-0.5 hover:text-foreground text-muted-foreground"
                            title="Edit Request"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteRequest(e, req.id)}
                            className="p-0.5 hover:text-destructive text-muted-foreground"
                            title="Delete Request"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-border mt-auto">
        <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-full p-2 rounded-none hover:bg-accent transition-colors">
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
