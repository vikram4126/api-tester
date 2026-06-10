import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';
import { Settings2, ChevronDown } from 'lucide-react';
import { EnvironmentEditorModal } from './EnvironmentEditorModal';

export function EnvironmentManager() {
  const { activeEnvId, setEnvId } = useAppStore();
  const environments = useLiveQuery(() => db.environments.toArray()) || [];
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeEnv = environments.find(e => e.id === activeEnvId);

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Environment Selector */}
        <div className="flex items-center gap-2.5 bg-secondary/20 px-3 rounded-none border border-border/50 group focus-within:border-primary/40 transition-all h-[34px] relative">
          <div className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
            activeEnvId
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)] animate-pulse'
              : 'bg-muted-foreground/30'
          }`} />
          <select
            value={activeEnvId || ''}
            onChange={(e) => setEnvId(e.target.value || null)}
            className="bg-transparent text-foreground text-[11px] font-bold outline-none cursor-pointer appearance-none pr-4 h-full min-w-[80px] max-w-[140px]"
          >
            <option value="" className="bg-background text-foreground">No Environment</option>
            {environments.map(env => (
              <option key={env.id} value={env.id} className="bg-background text-foreground">
                {env.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3 h-3 text-muted-foreground/40 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Manage Environments Button */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="h-[34px] flex items-center gap-1.5 px-3 bg-secondary/20 text-muted-foreground/70 hover:bg-primary/10 hover:text-primary rounded-none border border-border/50 hover:border-primary/20 transition-all shadow-sm text-[11px] font-bold"
          title="Manage Environments"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Manage</span>
        </button>
      </div>

      <EnvironmentEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
