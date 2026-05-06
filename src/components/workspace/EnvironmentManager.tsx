import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';

export function EnvironmentManager() {
  const { activeEnvId, setEnvId } = useAppStore();
  const environments = useLiveQuery(() => db.environments.toArray()) || [];

  const handleCreateEnv = async () => {
    const id = crypto.randomUUID();
    await db.environments.add({
      id,
      workspaceId: 'default',
      name: `New Env ${environments.length + 1}`,
      variables: {
        'base_url': 'https://api.example.com'
      }
    });
    setEnvId(id);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-3 bg-secondary/20 px-4 rounded-none border border-border/50 group focus-within:border-primary/40 focus-within:ring-0 transition-all h-[34px]">
        <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(0,51,141,0.5)]" />
        <span className="text-[11px] font-bold text-muted-foreground/60">Environment</span>
        <select 
          value={activeEnvId || ''}
          onChange={(e) => setEnvId(e.target.value || null)}
          className="bg-transparent text-foreground text-[11px] font-bold outline-none cursor-pointer appearance-none pr-4 h-full"
        >
          <option value="" className="bg-background text-foreground">Globals</option>
          {environments.map(env => (
            <option key={env.id} value={env.id} className="bg-background text-foreground">{env.name}</option>
          ))}
        </select>
      </div>
      <button 
        onClick={handleCreateEnv}
        className="w-[34px] h-[34px] flex items-center justify-center bg-secondary/20 text-muted-foreground/60 hover:bg-primary/10 hover:text-primary rounded-none border border-border/50 hover:border-primary/20 transition-all shadow-sm"
        title="Create New Environment"
      >
        <span className="text-xl font-light leading-none">+</span>
      </button>
    </div>

  );
}
