
import React, { useState, useRef } from 'react';
import { BookProject, StoryTemplate } from '../types';
import { generateStoryScript, generateStoryFromImage } from '../services/geminiService';

interface Props {
  project: BookProject;
  onNext: (updates: Partial<BookProject>) => void;
}

const IdeaSpark: React.FC<Props> = ({ project, onNext }) => {
  const [idea, setIdea] = useState(project.originalIdea);
  const [template, setTemplate] = useState<StoryTemplate>(project.template);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!idea.trim() && !uploadedImage) return;
    setIsGenerating(true);
    setError(null);
    try {
      let script;
      if (uploadedImage) {
        script = await generateStoryFromImage(uploadedImage, 'image/jpeg', template);
        onNext({
          originalIdea: script.extractedIdea,
          template,
          title: script.title,
          pages: script.pages,
          currentStep: 'character'
        });
      } else {
        script = await generateStoryScript(idea, template);
        onNext({
          originalIdea: idea,
          template,
          title: script.title,
          pages: script.pages,
          currentStep: 'character'
        });
      }
    } catch (err) {
      console.error(err);
      setError("Failed to spark the story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const templates = [
    { id: StoryTemplate.HERO_JOURNEY, icon: 'fa-shield-halved', desc: 'A grand adventure for a brave hero.' },
    { id: StoryTemplate.SEARCH_AND_FIND, icon: 'fa-magnifying-glass', desc: 'Interactive fun for little detectives.' },
    { id: StoryTemplate.BEDTIME_HEALING, icon: 'fa-moon', desc: 'Calming tales to help kids drift away.' },
    { id: StoryTemplate.WACKY_ADVENTURE, icon: 'fa-hat-wizard', desc: 'Silly situations and big laughs.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-header font-bold text-gray-900">1. The Idea Spark</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">Every great book starts with a tiny spark. Tell us what's on your mind, record a voice note, or snap a photo of a real scene!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 items-start">
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-orange-100/50 border border-orange-50">
            <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Your Story Seed</label>
            
            {uploadedImage ? (
              <div className="relative w-full h-40 rounded-2xl overflow-hidden border-2 border-orange-200 group">
                <img src={uploadedImage} className="w-full h-full object-cover" alt="Uploaded seed" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => setUploadedImage(null)} className="bg-white text-red-500 p-2 rounded-full shadow-lg">
                     <i className="fas fa-trash"></i>
                   </button>
                </div>
                <div className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                  Image Mode
                </div>
              </div>
            ) : (
              <textarea
                className="w-full h-40 p-4 rounded-2xl border-2 border-gray-100 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 transition-all outline-none text-lg resize-none"
                placeholder="e.g., A little penguin who wants to fly..."
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
            )}

            <div className="mt-4 flex gap-3">
              <button className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm font-bold">
                <i className="fas fa-microphone"></i>
                Voice
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-bold ${uploadedImage ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
              >
                <i className="fas fa-camera"></i>
                Photo Spark
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
          </div>
          
          {uploadedImage && (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
              <i className="fas fa-info-circle text-blue-500 mt-1"></i>
              <p className="text-xs text-blue-700 leading-relaxed">
                <strong>Magic Mode:</strong> We'll analyze your photo and turn the scene into a magical picture book script automatically.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <label className="block text-sm font-bold text-gray-700 mb-3 ml-1">Story Template</label>
          <div className="grid grid-cols-1 gap-4">
            {templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all ${
                  template === t.id 
                    ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-100' 
                    : 'border-white bg-white hover:border-orange-200'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${template === t.id ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-600'}`}>
                    <i className={`fas ${t.icon}`}></i>
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{t.id}</h4>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-center">{error}</div>}

      <div className="flex justify-center pt-6">
        <button
          onClick={handleGenerate}
          disabled={(!idea.trim() && !uploadedImage) || isGenerating}
          className={`px-12 py-5 rounded-2xl font-header font-bold text-xl shadow-lg transition-all flex items-center gap-3 ${
            (!idea.trim() && !uploadedImage) || isGenerating 
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
              : 'bg-orange-500 text-white hover:bg-orange-600 hover:-translate-y-1 active:scale-95'
          }`}
        >
          {isGenerating ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Dreaming Up the Story...
            </>
          ) : (
            <>
              Generate Script
              <i className="fas fa-magic"></i>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default IdeaSpark;
