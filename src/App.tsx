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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans">
      {/* 3-column "IDE" layout as per Stitch */}
      <Sidebar />
      <div className="flex flex-1 flex-col border-r border-border min-w-0">
        {/* Top Navigation / Environment bar - 64px height */}
        <header className="h-16 border-b border-border/50 flex items-center px-8 justify-between bg-card/30 backdrop-blur-2xl shrink-0 z-10 relative">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 group cursor-default">
              <img 
                src="/kpmg-logo.svg" 
                alt="KPMG" 
                className="h-6 w-auto dark:brightness-0 dark:invert opacity-90 group-hover:opacity-100 transition-opacity" 
              />

              <div className="w-px h-6 bg-border/50 mx-2 hidden sm:block"></div>
              <span className="text-[12px] font-bold text-slate-800 dark:text-white hidden sm:block transition-colors">
                Api Ninja pro <span className="text-primary dark:text-white/80">v.1.0</span>
              </span>
            </div>
          </div>


          <EnvironmentManager />
        </header>
        <Workbench />
      </div>
      <Inspector />
    </div>
  )
}

export default App
