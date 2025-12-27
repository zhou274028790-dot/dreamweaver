
import React, { useState, useRef } from 'react';
import { BookProject, VisualStyle } from '../types';
import { generateCharacterOptions } from '../services/geminiService';

interface Props {
  project: BookProject;
  onNext: (updates: Partial<BookProject>) => void;
  onBack: () => void;
}

const CharacterStudio: React.FC<Props> = ({ project, onNext, onBack }) => {
  const [desc, setDesc] = useState(project.characterDescription);
  const [style, setStyle] = useState<VisualStyle>(project.visualStyle);
  const [referenceImg, setReferenceImg] = useState<string | undefined>(project.characterReferenceImage);
  const [isGenerating, setIsGenerating] = useState(false);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImg(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!desc.trim() && !referenceImg) return;
    setIsGenerating(true);
    setError(null);
    try {
      const images = await generateCharacterOptions(desc, style, referenceImg);
      setOptions(images);
      setSelectedImage(images[0]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "角色生成遇到问题，请检查描述词是否包含敏感内容。");
    } finally {
      setIsGenerating(false);
    }
  };

  const styles = [
    { id: VisualStyle.WATERCOLOR, icon: '🎨', label: '柔和水彩' },
    { id: VisualStyle.CRAYON, icon: '🖍️', label: '手绘蜡笔' },
    { id: VisualStyle.GHIBLI, icon: '🌿', label: '宫崎骏风' },
    { id: VisualStyle.SHAUN_TAN, icon: '🌌', label: '陈志勇风' },
    { id: VisualStyle.PIXAR_3D, icon: '🎥', label: '现代3D' },
    { id: VisualStyle.PAPER_CUT, icon: '✂️', label: '艺术剪纸' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-header font-bold text-gray-900">2. 角色工作室</h2>
        <p className="text-lg text-gray-600">故事的核心。赋予你的主角生命，并保持全书形象统一！</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-lg border border-orange-50 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                主角外貌描述
                <span className="text-[10px] text-orange-500 uppercase tracking-widest font-bold">第一步</span>
              </label>
              <textarea
                className="w-full h-32 p-4 rounded-2xl border-2 border-gray-100 focus:border-orange-400 outline-none resize-none transition-all"
                placeholder="例如：一只戴着蓝色围巾和黄色靴子的蓬松橘色小猫。"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                角色参考图 (可选)
                <i className="fas fa-camera text-orange-400"></i>
              </label>
              {referenceImg ? (
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden border-2 border-orange-200 group mb-2">
                  <img src={referenceImg} className="w-full h-full object-cover" alt="Reference" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => setReferenceImg(undefined)} className="bg-white text-red-500 p-2 rounded-full shadow-lg">
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-2xl text-orange-600 font-bold hover:bg-orange-100 transition-all flex flex-col items-center gap-2 mb-2"
                >
                  <i className="fas fa-upload text-xl"></i>
                  <span className="text-xs">上传参考照片</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">艺术风格</label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                      style === s.id ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-50 bg-gray-50 hover:bg-white hover:border-gray-200'
                    }`}
                  >
                    <span>{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={(!desc.trim() && !referenceImg) || isGenerating}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                isGenerating ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  设计中...
                </>
              ) : (
                <>
                  <i className="fas fa-wand-sparkles"></i>
                  生成角色方案
                </>
              )}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-xl border border-orange-50 min-h-[400px] flex flex-col items-center justify-center text-center">
          {error ? (
            <div className="space-y-6 animate-in shake duration-500">
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl">
                <i className="fas fa-exclamation-circle"></i>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-red-600">生成出错了</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm">{error}</p>
                <button 
                  onClick={handleGenerate}
                  className="mt-4 px-6 py-2 bg-gray-100 text-gray-600 rounded-full font-bold text-xs hover:bg-gray-200 transition-all"
                >
                  再试一次
                </button>
              </div>
            </div>
          ) : options.length > 0 ? (
            <div className="w-full space-y-8 animate-in zoom-in-95 duration-300">
              <div className="grid grid-cols-2 gap-4">
                {options.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${
                      selectedImage === img ? 'border-orange-500 ring-4 ring-orange-100 scale-105 z-10' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="Character option" />
                    {selectedImage === img && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md">
                        <i className="fas fa-check"></i>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 inline-block mx-auto">
                <p className="text-orange-700 text-xs font-bold uppercase tracking-wider">
                   <i className="fas fa-lock mr-2"></i>
                   请选择一个形象来锁定全书角色一致性
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-32 h-32 bg-orange-50 rounded-full flex items-center justify-center mx-auto text-orange-200 text-5xl relative">
                {isGenerating ? (
                  <div className="w-full h-full flex items-center justify-center">
                     <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    <i className="fas fa-user-plus"></i>
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-lg border border-orange-50">
                      <i className="fas fa-sparkles text-sm"></i>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-gray-800 font-header">
                  {isGenerating ? "正在魔法创作中..." : "塑造你的英雄"}
                </h3>
                <p className="text-gray-500 max-w-xs mx-auto text-sm leading-relaxed">
                  {isGenerating 
                    ? "请稍候，我们正在为您绘制多个角色方案。通常需要 10-20 秒。" 
                    : "描述你的主角，或上传一张参考图。我们将为你生成多个角色方案供你挑选。"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center pt-8 border-t border-orange-100">
        <button onClick={onBack} className="px-8 py-3 bg-white border-2 border-gray-100 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all flex items-center gap-2">
          <i className="fas fa-arrow-left"></i>
          返回
        </button>
        <button
          onClick={() => onNext({ 
            characterDescription: desc, 
            characterReferenceImage: referenceImg,
            characterSeedImage: selectedImage!, 
            visualStyle: style, 
            currentStep: 'director' 
          })}
          disabled={!selectedImage || isGenerating}
          className={`px-12 py-4 rounded-2xl font-header font-bold text-xl shadow-lg transition-all flex items-center gap-3 ${
            !selectedImage || isGenerating ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-orange-500 text-white hover:bg-orange-600 hover:-translate-y-1'
          }`}
        >
          确定形象并继续
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );
};

export default CharacterStudio;
