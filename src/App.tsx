import { useAppStore } from './store/useAppStore';
import { Sidebar } from './components/layout/Sidebar';
import { Workbench } from './components/layout/Workbench';
import { Inspector } from './components/layout/Inspector';
import { EnvironmentManager } from './components/workspace/EnvironmentManager';
import { useEffect } from 'react';

function App() {
  const theme = useAppStore(state => state.theme);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* 3-column "IDE" layout */}
      <Sidebar />
      <div className="flex flex-1 flex-col border-r border-border min-w-0">
        {/* Top Navigation / Environment bar */}
        <header className="h-14 border-b border-border/50 flex items-center px-4 justify-between bg-background/80 backdrop-blur-xl shrink-0 z-10 relative">
          <h1 className="font-semibold text-lg flex items-center gap-2">
            <span className="text-primary bg-primary/10 p-1.5 rounded-md">
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
            </span>
            Smart Request
          </h1>
          <EnvironmentManager />
        </header>
        <Workbench />
      </div>
      <Inspector />
    </div>
  )
}

export default App
