
import React, { useState } from 'react';
import { BookProject, StoryPage, PageType, VisualStyle } from '../types';
import { generateSceneImage, generateStoryVideo, generateNextPageSuggestion } from '../services/geminiService';

interface Props {
  project: BookProject;
  onNext: (updates: Partial<BookProject>) => void;
  onBack: () => void;
}

const DirectorMode: React.FC<Props> = ({ project, onNext, onBack }) => {
  const [pages, setPages] = useState<StoryPage[]>(project.pages);
  const [currentStyle, setCurrentStyle] = useState<VisualStyle>(project.visualStyle);
  const [isProcessing, setIsProcessing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [videoProgressMsg, setVideoProgressMsg] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [tempText, setTempText] = useState("");
  const [isAddingPage, setIsAddingPage] = useState(false);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const generatePage = async (index: number, forcedStyle?: VisualStyle) => {
    const page = pages[index];
    const newPages = [...pages];
    newPages[index] = { ...page, isGenerating: true };
    setPages(newPages);

    try {
      const img = await generateSceneImage(
        page.text,
        page.visualPrompt,
        project.characterSeedImage!,
        forcedStyle || currentStyle
      );
      setPages(prev => {
        const updated = [...prev];
        updated[index] = { ...page, imageUrl: img, isGenerating: false };
        return updated;
      });
    } catch (err) {
      console.error(err);
      setPages(prev => {
        const updated = [...prev];
        updated[index] = { ...page, isGenerating: false };
        return updated;
      });
    }
  };

  const handleGenerateVideo = async () => {
    setIsVideoGenerating(true);
    setVideoProgressMsg("正在构思电影脚本...");
    try {
      const summary = pages.map(p => p.text).join(". ");
      const url = await generateStoryVideo(project.title, summary, (msg) => {
        setVideoProgressMsg(msg);
      });
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      // Reset key selection state if the request fails due to missing resources
      if (err.message?.includes("Requested entity was not found") && (window as any).aistudio) {
        await (window as any).aistudio.openSelectKey();
      }
      alert("视频生成失败，请稍后重试。");
    } finally {
      setIsVideoGenerating(false);
    }
  };

  const addPage = async () => {
    setIsAddingPage(true);
    try {
      const storyPages = pages.filter(p => p.type === 'story');
      const lastStoryText = storyPages[storyPages.length - 1]?.text || "";
      
      const suggestion = await generateNextPageSuggestion(project.originalIdea, lastStoryText);
      
      const newPage: StoryPage = {
        id: Math.random().toString(36).substr(2, 9),
        type: 'story',
        pageNumber: pages.length + 1,
        text: suggestion.text || "新的一天开始了...",
        visualPrompt: suggestion.visualPrompt || "The character in a new scene",
        isGenerating: false
      };

      const backPageIndex = pages.findIndex(p => p.type === 'back');
      const updatedPages = [...pages];
      if (backPageIndex !== -1) {
        updatedPages.splice(backPageIndex, 0, newPage);
      } else {
        updatedPages.push(newPage);
      }
      
      const renumbered = updatedPages.map((p, i) => ({ ...p, pageNumber: i + 1 }));
      setPages(renumbered);
    } catch (err) {
      alert("无法生成新页面内容");
    } finally {
      setIsAddingPage(false);
    }
  };

  const deletePage = (idx: number) => {
    if (pages[idx].type === 'cover' || pages[idx].type === 'back') {
      alert("封面和封底不能删除哦");
      return;
    }
    const filtered = pages.filter((_, i) => i !== idx);
    // Correcting the typo from 'rennumbered' to 'renumbered' below
    const renumbered = filtered.map((p, i) => ({ ...p, pageNumber: i + 1 }));
    setPages(renumbered);
  };

  const generateAll = async (clearExisting = false) => {
    setIsProcessing(true);
    const updatedPages = clearExisting ? pages.map(p => ({ ...p, imageUrl: undefined })) : [...pages];
    if (clearExisting) setPages(updatedPages);

    for (let i = 0; i < updatedPages.length; i++) {
      if (clearExisting || !updatedPages[i].imageUrl) {
        await generatePage(i);
      }
    }
    setIsProcessing(false);
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStyle = e.target.value as VisualStyle;
    setCurrentStyle(newStyle);
    onNext({ visualStyle: newStyle, pages });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const newPages = [...pages];
    newPages[editingIndex].text = tempText;
    setPages(newPages);
    setEditingIndex(null);
  };

  const renderPageCard = (page: StoryPage, idx: number) => (
    <div key={page.id} className={`bg-white rounded-3xl shadow-lg border overflow-hidden flex flex-col transition-all hover:shadow-xl group ${page.type === 'cover' ? 'border-orange-500 scale-105 z-10' : 'border-orange-50'}`}>
      <div className="relative aspect-[4/3] bg-gray-50 flex items-center justify-center overflow-hidden">
        {page.imageUrl ? (
          <img 
            src={page.imageUrl} 
            className="w-full h-full object-cover cursor-pointer hover:brightness-95 transition-all" 
            alt={`Page ${idx + 1}`} 
            onClick={() => setFullScreenImage(page.imageUrl || null)}
          />
        ) : page.isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs font-bold text-orange-500 uppercase">正在绘制...</span>
          </div>
        ) : (
          <button onClick={() => generatePage(idx)} className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center text-orange-500 hover:scale-110 transition-transform">
            <i className="fas fa-brush"></i>
          </button>
        )}
        <div className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded-full font-bold text-white ${page.type === 'cover' ? 'bg-orange-500' : page.type === 'back' ? 'bg-gray-600' : 'bg-black/50'}`}>
          {page.type === 'cover' ? '封面' : page.type === 'back' ? '封底' : `第 ${page.pageNumber} 页`}
        </div>
        
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {page.type === 'story' && (
            <button onClick={() => deletePage(idx)} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 shadow-sm hover:bg-red-50">
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
          )}
          <button onClick={() => { const n = [...pages]; n[idx].imageUrl = undefined; setPages(n); generatePage(idx); }} className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-gray-600 shadow-sm hover:text-orange-500">
            <i className="fas fa-redo text-xs"></i>
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between">
        {editingIndex === idx ? (
          <div className="space-y-2">
            <textarea autoFocus className="w-full p-2 text-sm border-2 border-orange-100 rounded-xl focus:border-orange-500 outline-none resize-none h-20 leading-relaxed" value={tempText} onChange={(e) => setTempText(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingIndex(null)} className="px-2 py-1 text-[10px] font-bold text-gray-400">取消</button>
              <button onClick={saveEdit} className="px-2 py-1 text-[10px] font-bold text-white bg-orange-500 rounded-md">保存</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-700 font-medium leading-relaxed italic line-clamp-3">"{page.text}"</p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{currentStyle}</span>
          {editingIndex !== idx && <button onClick={() => { setEditingIndex(idx); setTempText(page.text); }} className="text-[10px] text-orange-600 font-bold hover:underline">编辑文字</button>}
        </div>
      </div>
    </div>
  );

  const styleOptions = Object.values(VisualStyle);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-header font-bold text-gray-900">3. 导演模式 (Director Mode)</h2>
          <p className="text-lg text-gray-600">自定义绘本结构：你可以自由添加、删除页面，甚至随时更换艺术风格。</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col">
            <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-1 ml-1">艺术风格</label>
            <select 
              value={currentStyle}
              onChange={handleStyleChange}
              className="px-4 py-3 bg-white border-2 border-orange-100 rounded-xl text-sm font-bold text-gray-700 outline-none focus:border-orange-500 transition-all shadow-sm"
            >
              {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="h-10 w-[1px] bg-orange-100 hidden md:block self-end mb-1 mx-2"></div>

          <button onClick={addPage} disabled={isAddingPage} className="px-6 py-3 bg-white border-2 border-orange-200 text-orange-600 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-50 transition-all shadow-sm">
            {isAddingPage ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
            插入新页面
          </button>
          
          <div className="flex gap-2">
            <button 
              onClick={handleGenerateVideo} 
              disabled={isProcessing || isVideoGenerating}
              className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-md disabled:bg-gray-300"
            >
              {isVideoGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-film"></i>}
              生成视频预告
            </button>
             <button 
              onClick={() => generateAll(false)} 
              disabled={isProcessing} 
              className="px-6 py-3 bg-orange-500 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-orange-600 transition-all shadow-md disabled:bg-gray-300"
            >
              {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-play"></i>}
              生成未绘
            </button>
            <button 
              onClick={() => { if(confirm("确定要重新生成所有页面以匹配新风格吗？")) generateAll(true); }} 
              disabled={isProcessing} 
              className="px-4 py-3 bg-white border-2 border-orange-500 text-orange-500 rounded-xl font-bold flex items-center gap-2 hover:bg-orange-50 transition-all shadow-sm disabled:opacity-50"
              title="应用新风格到所有页面"
            >
              <i className="fas fa-sync-alt"></i>
              应用全书风格
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {pages.map((p, i) => renderPageCard(p, i))}
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-orange-100">
        <button onClick={onBack} className="px-8 py-3 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-500">上一步</button>
        <button onClick={() => onNext({ pages, currentStep: 'press', visualStyle: currentStyle })} className="px-12 py-4 bg-green-500 text-white rounded-2xl font-header font-bold text-xl shadow-lg hover:bg-green-600 transition-all">
          预览印刷版
          <i className="fas fa-arrow-right ml-3"></i>
        </button>
      </div>

      {isVideoGenerating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-indigo-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-lg rounded-[40px] p-12 text-center space-y-8 animate-in zoom-in-95">
             <div className="w-20 h-20 border-8 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
             <p className="text-indigo-600 font-bold text-xl">{videoProgressMsg}</p>
             <p className="text-gray-400 text-xs">视频生成可能需要几分钟，请不要关闭页面...</p>
          </div>
        </div>
      )}

      {videoUrl && (
        <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-10 animate-in fade-in">
           <div className="w-full max-w-4xl space-y-6">
             <div className="flex justify-between items-center text-white">
               <div>
                 <h3 className="text-2xl font-bold font-header">🎬 梦想预告片</h3>
                 <p className="text-gray-400 text-sm">您的绘本故事已转化为电影时刻</p>
               </div>
               <button onClick={() => setVideoUrl(null)} className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all">
                 <i className="fas fa-times text-xl"></i>
               </button>
             </div>
             <div className="aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10">
               <video src={videoUrl} controls autoPlay className="w-full h-full" />
             </div>
           </div>
        </div>
      )}

      {/* 图片全屏预览 */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
          onClick={() => setFullScreenImage(null)}
        >
          <button className="absolute top-8 right-8 text-white text-3xl hover:scale-110 transition-transform">
            <i className="fas fa-times"></i>
          </button>
          <img 
            src={fullScreenImage} 
            className="max-w-full max-h-full rounded-lg shadow-2xl animate-in zoom-in-95 duration-300" 
            alt="Full Preview" 
          />
        </div>
      )}
    </div>
  );
};

export default DirectorMode;
