import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';
import { X, Plus, Trash2, Globe, Check, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EnvironmentEditorModal({ isOpen, onClose }: Props) {
  const { activeEnvId, setEnvId } = useAppStore();
  const environments = useLiveQuery(() => db.environments.toArray()) || [];
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [envName, setEnvName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Key-value pair state for new row
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const selectedEnv = environments.find(e => e.id === selectedEnvId);

  // Sync selected env when modal opens or list changes
  useEffect(() => {
    if (isOpen && environments.length > 0) {
      if (!selectedEnvId || !environments.find(e => e.id === selectedEnvId)) {
        const active = environments.find(e => e.id === activeEnvId);
        setSelectedEnvId(active ? active.id : environments[0].id);
        setEnvName(active ? active.name : environments[0].name);
      }
    }
  }, [isOpen, environments, selectedEnvId, activeEnvId]);

  // Focus name input when editing
  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, isOpen]);

  const handleCreateEnv = async () => {
    const id = crypto.randomUUID();
    const name = `Environment ${environments.length + 1}`;
    await db.environments.add({
      id,
      workspaceId: 'default',
      name,
      variables: { base_url: '', bearer_token: '' }
    });
    setSelectedEnvId(id);
    setEnvId(id);
    setEnvName(name);
    setTimeout(() => setEditingName(true), 100);
    toast.success('Environment created & activated');
  };

  const handleDeleteEnv = async (id: string) => {
    await db.environments.delete(id);
    if (activeEnvId === id) setEnvId(null);
    const remaining = environments.filter(e => e.id !== id);
    setSelectedEnvId(remaining.length > 0 ? remaining[0].id : null);
    toast.success('Environment deleted');
  };

  const handleSaveName = async () => {
    if (selectedEnvId && envName.trim()) {
      await db.environments.update(selectedEnvId, { name: envName.trim() });
    }
    setEditingName(false);
  };

  const handleAddVariable = async () => {
    if (!selectedEnv || !newKey.trim()) return;
    const updated = { ...selectedEnv.variables, [newKey.trim()]: newValue };
    await db.environments.update(selectedEnv.id, { variables: updated });
    setNewKey('');
    setNewValue('');
    toast.success(`Variable "${newKey.trim()}" added`);
  };

  const handleUpdateVariable = async (key: string, value: string) => {
    if (!selectedEnv) return;
    const updated = { ...selectedEnv.variables, [key]: value };
    await db.environments.update(selectedEnv.id, { variables: updated });
  };

  const handleDeleteVariable = async (key: string) => {
    if (!selectedEnv) return;
    const updated = { ...selectedEnv.variables };
    delete updated[key];
    await db.environments.update(selectedEnv.id, { variables: updated });
    toast.success(`Variable "${key}" removed`);
  };

  const handleActivate = (id: string | null) => {
    setEnvId(id);
    toast.success(id ? `Environment activated` : 'No environment active');
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="env-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }}
          />

          {/* Modal */}
          <motion.div
            key="env-modal"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', pointerEvents: 'none' }}
          >
            <div
              className="pointer-events-auto w-full max-w-3xl bg-card border border-border/60 shadow-2xl shadow-black/40 rounded-none flex flex-col overflow-hidden"
              style={{ maxHeight: '80vh', pointerEvents: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-secondary/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-none flex items-center justify-center border border-primary/20">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-[14px] font-bold text-foreground">Manage Environments</h2>
                    <p className="text-[11px] text-muted-foreground/60 mt-0.5">
                      Add variables here → use <code className="bg-primary/10 text-primary px-1 rounded text-[10px]">{'{{variable_name}}'}</code> in URL, headers & body
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-none text-muted-foreground hover:text-foreground hover:bg-secondary/50 border border-transparent hover:border-border transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex flex-1 overflow-hidden min-h-0" style={{ minHeight: '350px' }}>
                {/* Left Panel: environment list */}
                <div className="w-52 border-r border-border/50 flex flex-col shrink-0 bg-secondary/5">
                  <div className="px-3 py-3 flex items-center justify-between border-b border-border/30">
                    <span className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider">Environments</span>
                    <button
                      onClick={handleCreateEnv}
                      className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-none border border-transparent hover:border-primary/20 transition-all"
                      title="New Environment"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-2">
                    {environments.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <Globe className="w-6 h-6 mx-auto mb-2 text-muted-foreground/30" />
                        <p className="text-[11px] text-muted-foreground/50">No environments yet</p>
                        <button
                          onClick={handleCreateEnv}
                          className="mt-3 text-[11px] text-primary font-bold hover:underline bg-primary/10 px-3 py-1.5 rounded-none border border-primary/20"
                        >
                          + Create Environment
                        </button>
                      </div>
                    ) : (
                      environments.map(env => (
                        <div
                          key={env.id}
                          onClick={() => { setSelectedEnvId(env.id); setEnvName(env.name); }}
                          className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer transition-all mx-1 rounded-none ${
                            selectedEnvId === env.id
                              ? 'bg-primary/10 border border-primary/20 text-primary'
                              : 'text-muted-foreground hover:bg-secondary/30 border border-transparent hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                              activeEnvId === env.id
                                ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                : 'bg-muted-foreground/20'
                            }`} />
                            <span className="text-[12px] font-medium truncate">{env.name}</span>
                            {activeEnvId === env.id && (
                              <span className="text-[9px] font-bold text-emerald-400 ml-auto shrink-0">ACTIVE</span>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteEnv(env.id); }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-all ml-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Right Panel: variables editor */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  {!selectedEnv ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/50 p-8 text-center">
                      <Globe className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm">Select an environment to edit its variables</p>
                      <button
                        onClick={handleCreateEnv}
                        className="mt-4 text-primary text-sm font-bold hover:underline bg-primary/10 px-4 py-2 rounded-none border border-primary/20"
                      >
                        + Create Environment
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Env Header */}
                      <div className="px-6 py-4 border-b border-border/40 bg-secondary/5 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {editingName ? (
                            <input
                              ref={nameInputRef}
                              value={envName}
                              onChange={e => setEnvName(e.target.value)}
                              onBlur={handleSaveName}
                              onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                              className="bg-background border border-primary/40 rounded-none px-3 py-1.5 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/10 text-foreground min-w-0 flex-1 max-w-[220px]"
                            />
                          ) : (
                            <div className="flex items-center gap-2 group/name cursor-pointer" onClick={() => { setEnvName(selectedEnv.name); setEditingName(true); }}>
                              <span className="text-[14px] font-bold text-foreground">{selectedEnv.name}</span>
                              <Edit2 className="w-3 h-3 text-muted-foreground/40 group-hover/name:text-muted-foreground transition-colors" />
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleActivate(activeEnvId === selectedEnv.id ? null : selectedEnv.id)}
                            className={`flex items-center gap-1.5 text-[11px] font-bold px-4 py-2 rounded-none border transition-all ${
                              activeEnvId === selectedEnv.id
                                ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30 hover:bg-emerald-400/20'
                                : 'bg-primary text-primary-foreground border-primary/20 hover:bg-primary/90 shadow-sm shadow-primary/20'
                            }`}
                          >
                            {activeEnvId === selectedEnv.id ? (
                              <><Check className="w-3 h-3" /> Active</>
                            ) : (
                              '⚡ Set Active'
                            )}
                          </button>
                        </div>
                      </div>

                      {/* How to use */}
                      <div className="px-6 py-3 bg-primary/5 border-b border-primary/10 shrink-0">
                        <p className="text-[11px] text-primary/80 leading-relaxed mb-1">
                          <strong>How to use:</strong> Set <code className="bg-primary/15 px-1.5 py-0.5 rounded text-[10px] font-mono">base_url</code> = <code className="bg-primary/15 px-1.5 py-0.5 rounded text-[10px] font-mono">https://api.example.com</code>, then in URL bar type: <code className="bg-primary/15 px-1.5 py-0.5 rounded text-[10px] font-mono">{'{{base_url}}'}/users</code>
                        </p>
                        <p className="text-[11px] text-primary/80 leading-relaxed">
                          <strong>Global Auth:</strong> Set a variable named <code className="bg-primary/15 px-1.5 py-0.5 rounded text-[10px] font-mono">bearer_token</code> to automatically inject a Bearer Token header into all requests.
                        </p>
                      </div>

                      {/* Variables table */}
                      <div className="flex-1 overflow-y-auto">
                        {/* Table header */}
                        <div className="grid grid-cols-[1fr_1.5fr_36px] px-6 py-2 border-b border-border/30 bg-secondary/5 sticky top-0">
                          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Variable Name</span>
                          <span className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">Value</span>
                          <span />
                        </div>

                        {Object.entries(selectedEnv.variables).length === 0 && (
                          <div className="px-6 py-8 text-center text-sm text-muted-foreground/50">
                            No variables yet. Add one below. ↓
                          </div>
                        )}

                        {Object.entries(selectedEnv.variables).map(([key, value]) => (
                          <div
                            key={key}
                            className="grid grid-cols-[1fr_1.5fr_36px] px-6 py-0 border-b border-border/20 group hover:bg-secondary/10 transition-colors"
                          >
                            <div className="flex items-center pr-3 border-r border-border/20 py-2.5">
                              <code className="text-[12px] font-mono text-primary/80 font-medium bg-primary/5 px-2 py-0.5 rounded-sm">
                                {key}
                              </code>
                              <span className="text-[10px] text-muted-foreground/30 ml-2 font-mono">{`{{${key}}}`}</span>
                            </div>
                            <div className="flex items-center pl-3 border-r border-border/20 py-1.5">
                              <input
                                type="text"
                                value={value}
                                placeholder="Enter value..."
                                onChange={e => handleUpdateVariable(key, e.target.value)}
                                className="w-full bg-transparent text-[12px] font-mono text-foreground outline-none placeholder:text-muted-foreground/30 focus:bg-primary/5 px-2 py-1 rounded-sm transition-colors"
                              />
                            </div>
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleDeleteVariable(key)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground/40 hover:text-destructive transition-all rounded-sm hover:bg-destructive/10"
                                title="Remove variable"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add new variable row */}
                      <div className="px-6 py-3 border-t border-border/40 bg-secondary/5 shrink-0">
                        <p className="text-[10px] text-muted-foreground/50 mb-2 font-bold uppercase tracking-wider">Add New Variable</p>
                        <div className="grid grid-cols-[1fr_1.5fr_auto] gap-2 items-center">
                          <input
                            type="text"
                            placeholder="e.g. bearer_token, api_key"
                            value={newKey}
                            onChange={e => setNewKey(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
                            className="bg-background border border-border/50 rounded-none px-3 py-2 text-[12px] font-mono text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/30 transition-all"
                          />
                          <input
                            type="text"
                            placeholder="e.g. https://api.example.com"
                            value={newValue}
                            onChange={e => setNewValue(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddVariable()}
                            className="bg-background border border-border/50 rounded-none px-3 py-2 text-[12px] font-mono text-foreground outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 placeholder:text-muted-foreground/30 transition-all"
                          />
                          <button
                            onClick={handleAddVariable}
                            disabled={!newKey.trim()}
                            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-[12px] font-bold rounded-none border border-primary/20 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm shadow-primary/20"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render at document.body level, escaping any overflow:hidden parents
  return createPortal(modalContent, document.body);
}
