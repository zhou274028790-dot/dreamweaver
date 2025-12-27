
import React, { useState, useEffect } from 'react';
import { BookProject, StoryTemplate, VisualStyle } from './types';
import IdeaSpark from './components/IdeaSpark';
import CharacterStudio from './components/CharacterStudio';
import DirectorMode from './components/DirectorMode';
import ThePress from './components/ThePress';
import BookLibrary from './components/BookLibrary';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'studio' | 'library'>('studio');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [project, setProject] = useState<BookProject>({
    id: Math.random().toString(36).substr(2, 9),
    title: '',
    originalIdea: '',
    template: StoryTemplate.HERO_JOURNEY,
    pages: [],
    characterDescription: '',
    visualStyle: VisualStyle.WATERCOLOR,
    currentStep: 'idea',
    createdAt: Date.now()
  });

  const [history, setHistory] = useState<BookProject[]>([]);

  // 监听 PWA 安装事件
  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    }
  };

  // 载入历史记录
  useEffect(() => {
    const saved = localStorage.getItem('dreamweaver_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // 关键修复：处理存储溢出异常
  useEffect(() => {
    if (project.currentStep === 'press' && project.pages.length > 0) {
      setHistory(prev => {
        const index = prev.findIndex(b => b.id === project.id);
        let newHistory;
        if (index > -1) {
          newHistory = [...prev];
          newHistory[index] = project;
        } else {
          newHistory = [...prev, { ...project, createdAt: Date.now() }];
        }
        
        try {
          localStorage.setItem('dreamweaver_history', JSON.stringify(newHistory));
        } catch (e) {
          console.warn("数据太大，无法存入本地收藏夹，但不影响当前预览。", e);
        }
        
        return newHistory;
      });
    }
  }, [project]);

  const updateProject = (updates: Partial<BookProject>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const startNewProject = () => {
    setProject({
      id: Math.random().toString(36).substr(2, 9),
      title: '',
      originalIdea: '',
      template: StoryTemplate.HERO_JOURNEY,
      pages: [],
      characterDescription: '',
      visualStyle: VisualStyle.WATERCOLOR,
      currentStep: 'idea',
      createdAt: Date.now()
    });
    setCurrentView('studio');
  };

  const selectBookFromLibrary = (book: BookProject) => {
    setProject(book);
    setCurrentView('studio');
  };

  const deleteBook = (id: string) => {
    const newHistory = history.filter(b => b.id !== id);
    setHistory(newHistory);
    try {
      localStorage.setItem('dreamweaver_history', JSON.stringify(newHistory));
    } catch (e) {}
  };

  const renderStep = () => {
    if (currentView === 'library') {
      return (
        <BookLibrary 
          history={history} 
          onSelect={selectBookFromLibrary} 
          onDelete={deleteBook}
          onNewProject={startNewProject}
        />
      );
    }

    switch (project.currentStep) {
      case 'idea':
        return <IdeaSpark key="idea" project={project} onNext={updateProject} />;
      case 'character':
        return <CharacterStudio key="char" project={project} onNext={updateProject} onBack={() => updateProject({ currentStep: 'idea' })} />;
      case 'director':
        return <DirectorMode key="dir" project={project} onNext={updateProject} onBack={() => updateProject({ currentStep: 'character' })} />;
      case 'press':
        return <ThePress key="press" project={project} onBack={() => updateProject({ currentStep: 'director' })} />;
      default:
        return <IdeaSpark project={project} onNext={updateProject} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-orange-100 py-4 px-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('studio')}>
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white text-xl">
              <i className="fas fa-book-open"></i>
            </div>
            <h1 className="text-2xl font-header font-bold text-gray-800">DreamWeaver</h1>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {currentView === 'studio' ? (
              <>
                <StepIndicator current={project.currentStep} step="idea" label="创意" index={1} />
                <div className="w-8 h-[2px] bg-gray-200 mx-1"></div>
                <StepIndicator current={project.currentStep} step="character" label="主角" index={2} />
                <div className="w-8 h-[2px] bg-gray-200 mx-1"></div>
                <StepIndicator current={project.currentStep} step="director" label="导演" index={3} />
                <div className="w-8 h-[2px] bg-gray-200 mx-1"></div>
                <StepIndicator current={project.currentStep} step="press" label="印刷" index={4} />
              </>
            ) : (
              <div className="px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-bold flex items-center gap-2">
                <i className="fas fa-layer-group"></i>
                我的图书馆
              </div>
            )}
          </nav>

          <div className="flex items-center gap-3">
            {deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="hidden sm:flex px-4 py-2 bg-blue-500 text-white rounded-xl font-bold text-sm items-center gap-2 shadow-md animate-bounce"
              >
                <i className="fas fa-download"></i>
                下载 App
              </button>
            )}
            <button 
              onClick={() => setCurrentView(currentView === 'studio' ? 'library' : 'studio')}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 font-bold text-sm ${
                currentView === 'library' 
                  ? 'bg-orange-500 text-white shadow-lg' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <i className="fas fa-book-bookmark"></i>
              <span className="hidden sm:inline">图书馆</span>
              {history.length > 0 && (
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${currentView === 'library' ? 'bg-white text-orange-500' : 'bg-orange-500 text-white'}`}>
                  {history.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto bg-[#fdf6f0] pb-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {renderStep()}
        </div>
      </main>
    </div>
  );
};

const StepIndicator: React.FC<{ current: string, step: string, label: string, index: number }> = ({ current, step, label, index }) => {
  const steps = ['idea', 'character', 'director', 'press'];
  const isActive = current === step;
  const isCompleted = steps.indexOf(current) > steps.indexOf(step);

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${isActive ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-400'}`}>
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${isActive ? 'bg-orange-500 text-white' : isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {isCompleted ? <i className="fas fa-check"></i> : index}
      </div>
      <span className="text-sm">{label}</span>
    </div>
  );
};

export default App;
