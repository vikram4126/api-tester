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
    <div className="flex flex-col h-full bg-card rounded-md border border-border overflow-hidden p-2 shadow-sm">
      <div className="flex items-center gap-2 mb-2 p-1 bg-muted/30 rounded">
        {['cURL', 'Fetch', 'Python Requests'].map(l => (
          <button 
           key={l} 
           onClick={() => setLang(l)} 
           className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${lang === l ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
          >
            {l}
          </button>
        ))}
      </div>
      <div className="flex-1 relative border border-border rounded overflow-hidden">
        <CodeEditor value={snippet} language={lang === 'cURL' ? 'shell' : lang === 'Fetch' ? 'javascript' : 'python'} readOnly />
      </div>
    </div>
  );
}
