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
    <div className="flex items-center gap-2 p-2 px-4 border-b border-border bg-card">
      <span className="text-xs font-semibold text-muted-foreground uppercase">Environment:</span>
      <select 
        value={activeEnvId || ''}
        onChange={(e) => setEnvId(e.target.value || null)}
        className="bg-accent text-accent-foreground text-xs font-medium rounded px-2 py-1 outline-none cursor-pointer"
      >
        <option value="">No Environment</option>
        {environments.map(env => (
          <option key={env.id} value={env.id}>{env.name}</option>
        ))}
      </select>
      <button 
        onClick={handleCreateEnv}
        className="text-xs bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground px-2 py-1 rounded transition-colors"
      >
        + New
      </button>
    </div>
  );
}
