
import React from 'react';
import { BookProject } from '../types';

interface Props {
  history: BookProject[];
  onSelect: (book: BookProject) => void;
  onDelete: (id: string) => void;
  onNewProject: () => void;
}

const BookLibrary: React.FC<Props> = ({ history, onSelect, onDelete, onNewProject }) => {
  if (history.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center space-y-8 animate-in fade-in zoom-in-95 duration-700">
        <div className="w-40 h-40 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-200 text-6xl">
          <i className="fas fa-book-open"></i>
        </div>
        <div className="space-y-4">
          <h2 className="text-4xl font-header font-bold text-gray-900">你的图书馆空空如也</h2>
          <p className="text-lg text-gray-500 max-w-md mx-auto">你还没有编织过任何梦想！今天就开始你的第一段神奇旅程吧。</p>
        </div>
        <button
          onClick={onNewProject}
          className="px-12 py-5 bg-orange-500 text-white rounded-3xl font-header font-bold text-xl shadow-xl hover:bg-orange-600 hover:-translate-y-1 transition-all flex items-center gap-3 mx-auto"
        >
          开始新故事
          <i className="fas fa-plus"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-header font-bold text-gray-900">我的梦想图书馆</h2>
          <p className="text-gray-500">这里收藏了你所有的独特冒险。</p>
        </div>
        <button
          onClick={onNewProject}
          className="px-6 py-3 bg-orange-500 text-white rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-all flex items-center gap-2"
        >
          <i className="fas fa-plus"></i>
          制作新绘本
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {history.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).map((book) => (
          <div 
            key={book.id} 
            className="bg-white rounded-[2.5rem] shadow-lg border border-orange-50 overflow-hidden group hover:shadow-2xl transition-all hover:-translate-y-2 flex flex-col"
          >
            <div 
              className="relative aspect-[3/4] bg-orange-50 cursor-pointer overflow-hidden"
              onClick={() => onSelect({ ...book, currentStep: 'press' })}
            >
              {book.pages[0]?.imageUrl ? (
                <img 
                  src={book.pages[0].imageUrl} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  alt={book.title} 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-orange-200 text-6xl italic font-header bg-gradient-to-br from-orange-50 to-white">
                   {book.title?.charAt(0) || "梦"}
                </div>
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <button className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold shadow-lg">
                  打开绘本
                </button>
              </div>

              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); if(confirm("确定要删除这本绘本吗？")) onDelete(book.id); }}
                  className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900 font-header line-clamp-1">{book.title || "未命名故事"}</h3>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase tracking-widest">
                  <i className="fas fa-magic text-[10px]"></i>
                  {book.visualStyle?.split(' ')[0] || "艺术"} • {book.pages?.length || 0} 页
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                 <button 
                  onClick={() => onSelect({ ...book, currentStep: 'director' })}
                  className="py-2.5 text-xs font-bold bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors flex flex-col items-center gap-1"
                >
                  <i className="fas fa-edit"></i>
                  编辑
                </button>
                 <button 
                  onClick={() => onSelect({ ...book, currentStep: 'press' })}
                  className="py-2.5 text-xs font-bold bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors flex flex-col items-center gap-1"
                >
                  <i className="fas fa-eye"></i>
                  阅读
                </button>
                <button 
                  onClick={() => onSelect({ ...book, currentStep: 'press' })}
                  className="py-2.5 text-xs font-bold bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors flex flex-col items-center gap-1"
                >
                  <i className="fas fa-print"></i>
                  订购
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookLibrary;
