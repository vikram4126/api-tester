import { useAppStore } from '@/store/useAppStore';
import Editor from '@monaco-editor/react';

interface CodeEditorProps {
  value: string;
  language?: string;
  onChange?: (val: string | undefined) => void;
  readOnly?: boolean;
}

export function CodeEditor({ value, language = "json", onChange, readOnly = false }: CodeEditorProps) {
  const theme = useAppStore(state => state.theme);

  return (
    <div className="flex-1 w-full h-full relative border border-border/50 rounded-xl overflow-hidden bg-[#1e1e1e]">

      <Editor
        height="100%"
        language={language}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        value={value}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          readOnly: readOnly,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          lineHeight: 24,
          scrollbar: {
            verticalScrollbarSize: 10,
            horizontalScrollbarSize: 10,
          },
          renderLineHighlight: 'all',
          guides: { indentation: true },
        }}
      />
    </div>
  );
}
