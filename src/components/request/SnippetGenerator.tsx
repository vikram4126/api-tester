import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type RequestItem } from '@/lib/db';
import { useAppStore } from '@/store/useAppStore';
import { CodeEditor } from '@/components/ui/CodeEditor';

export function SnippetGenerator() {
  const activeRequestId = useAppStore(state => state.activeRequestId);
  const [lang, setLang] = useState('cURL');

  const request = useLiveQuery(
    async () => activeRequestId ? await db.requests.get(activeRequestId) : null,
    [activeRequestId]
  ) as RequestItem | undefined | null;

  if (!request) return null;

  const getSnippet = () => {
    const url = request.url || '';
    const method = request.method;
    const bodyStr = request.body.type === 'json' ? request.body.content : '';
    const headers = Object.entries(request.headers).map(([k,v]) => `-H "${k}: ${v}"`).join(' ');

    switch (lang) {
      case 'Fetch':
        return `fetch("${url}", {\n  method: "${method}",\n  headers: ${JSON.stringify(request.headers, null, 2)},\n  body: ${bodyStr ? bodyStr : 'undefined'}\n});`;
      case 'Python Requests':
        return `import requests\n\nurl = "${url}"\nheaders = ${JSON.stringify(request.headers, null, 2)}\n\nresponse = requests.request("${method}", url, headers=headers${bodyStr ? `, data=${bodyStr}` : ''})\n\nprint(response.text)`;
      case 'cURL':
      default:
        let curl = `curl --request ${method} \\\n  --url ${url}`;
        if (headers) curl += ` \\\n  ${headers}`;
        if (bodyStr) curl += ` \\\n  --data '${bodyStr}'`;
        return curl;
    }
  };

  const snippet = getSnippet();

  return (
    <div className="flex flex-col h-full bg-card/30 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden p-3 shadow-lg shadow-black/20">
      <div className="flex items-center gap-3 mb-3 p-2 bg-white/5 rounded-xl border border-white/5">
        {['cURL', 'Fetch', 'Python Requests'].map(l => (
          <button 
           key={l} 
           onClick={() => setLang(l)} 
           className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
             lang === l 
               ? 'bg-primary text-white shadow-[0_0_15px_rgba(0,174,239,0.3)]' 
               : 'text-muted-foreground/40 hover:bg-white/5 hover:text-foreground'
           }`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex-1 relative border border-border/50 rounded-xl overflow-hidden shadow-inner">
        <CodeEditor value={snippet} language={lang === 'cURL' ? 'shell' : lang === 'Fetch' ? 'javascript' : 'python'} readOnly />
      </div>
    </div>

  );
}
