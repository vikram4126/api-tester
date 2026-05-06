import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { injectVariables } from '@/lib/parser';
import { db, type RequestItem, type Environment } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

const PROXY_URL = (import.meta.env.VITE_PROXY_URL || 'http://localhost:4000') + '/proxy?url=';

export function useApiExecutor() {
  const activeRequestId = useAppStore(state => state.activeRequestId);
  const activeEnvId = useAppStore(state => state.activeEnvId);

  // Fetch active request
  const request = useLiveQuery(
    async () => activeRequestId ? await db.requests.get(activeRequestId) : null,
    [activeRequestId]
  ) as RequestItem | undefined | null;

  // Fetch active environment
  const environment = useLiveQuery(
    async () => activeEnvId ? await db.environments.get(activeEnvId) : null,
    [activeEnvId]
  ) as Environment | undefined | null;

  return useQuery({
    queryKey: ['execute', activeRequestId],
    queryFn: async () => {
      if (!request) throw new Error('No active request selected');

      const vars = environment?.variables || {};
      let injectedUrl = injectVariables(request.url, vars);
      
      if (request.params && Object.keys(request.params).length > 0) {
        try {
          const urlObj = new URL(injectedUrl);
          Object.entries(request.params).forEach(([key, val]) => {
            if (key) {
               urlObj.searchParams.append(injectVariables(key, vars), injectVariables(val, vars));
            }
          });
          injectedUrl = urlObj.toString();
        } catch { /* ignore invalid url */ }
      }
      
      const targetUrl = PROXY_URL + encodeURIComponent(injectedUrl);
      
      const headers = new Headers();
      // Inject variables into headers
      Object.entries(request.headers).forEach(([key, val]) => {
        if (key && typeof val === 'string') {
          headers.append(injectVariables(key, vars), injectVariables(val, vars));
        }
      });

      const options: RequestInit = {
        method: request.method,
        headers,
      };

      if (request.method !== 'GET' && request.method !== 'HEAD' && request.body.type !== 'none') {
        let bodyContent = request.body.content;
        if (request.body.type === 'json' || request.body.type === 'raw') {
          bodyContent = injectVariables(bodyContent, vars);
        }
        options.body = bodyContent;
        if (request.body.type === 'json' && !headers.has('Content-Type')) {
           headers.append('Content-Type', 'application/json');
        }
      }

      const startTime = performance.now();
      const res = await fetch(targetUrl, options);
      const endTime = performance.now();

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      const blob = await res.blob();
      const size = blob.size;
      const text = await blob.text();
      let data: unknown = text;
      try {
        data = JSON.parse(text) as unknown;
      } catch {
        // keep as text
      }

      // Log to history
      await db.history.add({
        id: crypto.randomUUID(),
        requestId: request.id,
        method: request.method,
        url: injectedUrl,
        status: res.status,
        statusText: res.statusText,
        time: Math.round(endTime - startTime),
        size,
        timestamp: Date.now()
      });

      return {
        status: res.status,
        statusText: res.statusText,
        time: Math.round(endTime - startTime),
        size,
        headers: responseHeaders,
        data,
      };
    },
    enabled: false, // Only trigger manually via refetch()
  });
}
