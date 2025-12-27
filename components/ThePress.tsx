
import React, { useState, useMemo } from 'react';
import { BookProject, StoryPage } from '../types';

interface Props {
  project: BookProject;
  onBack: () => void;
}

const ThePress: React.FC<Props> = ({ project, onBack }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const pages = useMemo(() => project.pages || [], [project.pages]);
  
  if (pages.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center space-y-6">
        <div className="text-6xl text-orange-200"><i className="fas fa-ghost"></i></div>
        <h3 className="text-2xl font-bold text-gray-800">未找到故事内容</h3>
        <p className="text-gray-500">可能由于某些错误数据丢失了，请尝试返回重新生成。</p>
        <button onClick={onBack} className="px-6 py-2 bg-orange-500 text-white rounded-xl font-bold">返回</button>
      </div>
    );
  }

  const isCover = currentIndex === 0;
  const isBackCover = currentIndex === pages.length - 1;
  const isSpread = !isCover && !isBackCover;

  const handleNext = () => {
    if (isCover) {
      setCurrentIndex(1);
    } else if (isSpread) {
      const nextIdx = currentIndex + 2;
      if (nextIdx >= pages.length - 1) {
        setCurrentIndex(pages.length - 1);
      } else {
        setCurrentIndex(nextIdx);
      }
    }
  };

  const handlePrev = () => {
    if (isBackCover) {
      const storyPages = pages.length - 2;
      const lastSpreadStart = storyPages % 2 === 0 ? pages.length - 3 : pages.length - 2;
      setCurrentIndex(Math.max(1, lastSpreadStart));
    } else if (currentIndex === 1) {
      setCurrentIndex(0);
    } else {
      setCurrentIndex(Math.max(1, currentIndex - 2));
    }
  };

  const renderSinglePage = (page: StoryPage, type: 'left' | 'right' | 'single') => (
    <div className={`
      relative bg-[#fffcf9] p-6 md:p-10 flex flex-col items-center justify-center text-center h-full w-full
      ${type === 'left' ? 'border-r border-gray-100 rounded-l-3xl shadow-[inset_-15px_0_30px_rgba(0,0,0,0.02)]' : ''}
      ${type === 'right' ? 'rounded-r-3xl shadow-[inset_15px_0_30px_rgba(0,0,0,0.02)]' : ''}
      ${type === 'single' ? 'rounded-3xl border border-gray-100 shadow-2xl' : ''}
    `}>
      <div className="w-full h-full flex flex-col">
        {page.imageUrl ? (
          <img 
            src={page.imageUrl} 
            className="w-full aspect-[4/3] object-cover rounded-xl shadow-md mb-6 cursor-zoom-in hover:brightness-95 transition-all" 
            alt="Preview" 
            onClick={() => setFullScreenImage(page.imageUrl || null)}
          />
        ) : (
          <div className="w-full aspect-[4/3] bg-orange-50 rounded-xl mb-6 flex items-center justify-center text-orange-200">
            <i className="fas fa-image text-4xl"></i>
          </div>
        )}
        <div className="flex-1 flex flex-col justify-center px-4">
          <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed font-serif italic">
            "{page.text}"
          </p>
          <div className="mt-4">
             <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest px-3 py-1 bg-orange-50 rounded-full">
               {page.type === 'cover' ? '封面' : page.type === 'back' ? '封底' : `第 ${page.pageNumber} 页`}
             </span>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper.png')] opacity-10 rounded-[inherit]"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h2 className="text-4xl md:text-5xl font-header font-bold text-gray-900">{project.title || "我的故事书"}</h2>
        <p className="text-gray-500">这是为你精心排版的最终版本，点击左右箭头翻阅。点击图片可放大查看。</p>
      </div>

      <div className="relative flex items-center justify-center min-h-[500px] py-4">
        <div className="w-full max-w-4xl h-[550px] flex items-center justify-center relative">
          
          {isCover && (
            <div className="h-full w-full max-w-md animate-in zoom-in-95 duration-500">
              {renderSinglePage(pages[0], 'single')}
            </div>
          )}

          {isSpread && (
            <div className="grid grid-cols-2 h-full w-full shadow-2xl rounded-3xl overflow-hidden border-8 border-white bg-white animate-in slide-in-from-right-4 duration-500">
              {renderSinglePage(pages[currentIndex], 'left')}
              {pages[currentIndex + 1] ? renderSinglePage(pages[currentIndex + 1], 'right') : (
                <div className="bg-[#fffcf9] rounded-r-3xl flex items-center justify-center text-gray-200 border-l border-gray-100">End</div>
              )}
            </div>
          )}

          {isBackCover && (
            <div className="h-full w-full max-w-md animate-in zoom-in-95 duration-500">
              {renderSinglePage(pages[pages.length - 1], 'single')}
            </div>
          )}

          <button 
            onClick={handlePrev} 
            disabled={isCover}
            className="absolute -left-4 md:-left-16 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-400 hover:text-orange-500 transition-all disabled:opacity-0 z-20"
          >
            <i className="fas fa-chevron-left text-xl"></i>
          </button>
          <button 
            onClick={handleNext} 
            disabled={isBackCover}
            className="absolute -right-4 md:-right-16 top-1/2 -translate-y-1/2 w-12 h-12 md:w-16 md:h-16 bg-white rounded-full shadow-xl flex items-center justify-center text-gray-400 hover:text-orange-500 transition-all disabled:opacity-0 z-20"
          >
            <i className="fas fa-chevron-right text-xl"></i>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto pt-6">
        <button 
          onClick={() => { setIsExporting(true); setTimeout(() => {setIsExporting(false); alert("PDF 导出成功！");}, 1500); }}
          className="p-8 bg-white border-2 border-orange-100 rounded-3xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center gap-4 group"
        >
          <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-file-pdf"></i>
          </div>
          <div className="text-center">
            <h4 className="text-xl font-bold text-gray-800">导出数字 PDF</h4>
            <p className="text-sm text-gray-400">免费获取高清数字版</p>
          </div>
        </button>

        <button 
          onClick={() => setShowOrderModal(true)}
          className="p-8 bg-orange-500 text-white rounded-3xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all flex flex-col items-center gap-4 group"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            <i className="fas fa-gift"></i>
          </div>
          <div className="text-center">
            <h4 className="text-xl font-bold">订购实体绘本</h4>
            <p className="text-white/80 text-sm">精装硬壳，快递到家 (¥168)</p>
          </div>
        </button>
      </div>

      <div className="text-center pb-10">
        <button onClick={onBack} className="text-gray-400 font-bold hover:text-orange-500 flex items-center gap-2 mx-auto">
          <i className="fas fa-arrow-left"></i> 返回导演模式继续修改
        </button>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative">
            <button onClick={() => setShowOrderModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-3xl mx-auto"><i className="fas fa-shopping-basket"></i></div>
              <h3 className="text-2xl font-bold text-gray-800">确认订单</h3>
              <div className="bg-gray-50 p-6 rounded-2xl text-left space-y-2">
                <div className="flex justify-between text-sm"><span>精装硬壳绘本 × 1</span><span className="font-bold">¥ 168.00</span></div>
                <div className="flex justify-between text-sm"><span>顺丰包邮</span><span className="font-bold">¥ 0.00</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg text-orange-600"><span>总计</span><span>¥ 168.00</span></div>
              </div>
              <button onClick={() => { setShowOrderModal(false); alert("支付成功！我们将尽快制作并邮寄。"); }} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-bold text-lg shadow-lg">去支付</button>
            </div>
          </div>
        </div>
      )}

      {/* 图片全屏预览 */}
      {fullScreenImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-in fade-in duration-300"
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

export default ThePress;
