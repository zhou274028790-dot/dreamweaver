
import { GoogleGenAI, Type } from "@google/genai";
import { StoryTemplate, StoryPage, VisualStyle } from "../types";

const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateStoryScript = async (idea: string, template: StoryTemplate): Promise<{ title: string; pages: StoryPage[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `请基于以下创意为儿童绘本创作完整脚本（语言：中文）: "${idea}"。
                 遵循结构: ${template}。
                 绘本结构要求：
                 1. 一个吸引人的封面 (cover)，包含书名和封面文字。
                 2. 6-8页的故事情节 (story)。
                 3. 一个温馨的封底 (back)，包含结语。
                 每一页需要一段简短文字和一段详细的视觉提示词（Visual Prompt，要求用英文描述，包含场景、光影、角色状态，以便后续绘画）。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["cover", "story", "back"] },
                  text: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                },
                required: ["type", "text", "visualPrompt"],
              },
            },
          },
          required: ["title", "pages"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("AI 响应内容为空，请稍后重试。");
    
    const data = JSON.parse(text.trim());
    return {
      title: data.title || "未命名故事",
      pages: (data.pages || []).map((p: any, idx: number) => ({
        ...p,
        id: generateId(),
        pageNumber: idx + 1
      }))
    };
  } catch (error) {
    console.error("Story Generation Error:", error);
    throw error;
  }
};

export const generateStoryFromImage = async (base64Image: string, mimeType: string, template: StoryTemplate): Promise<{ title: string; pages: StoryPage[]; extractedIdea: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: mimeType } },
          { text: `请分析这张照片并将其转化为神奇绘本脚本（语言：中文）。要求包含封面 (cover)、故事正文 (story) 和封底 (back)。遵循 ${template}。返回 JSON 格式。` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            extractedIdea: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["cover", "story", "back"] },
                  text: { type: Type.STRING },
                  visualPrompt: { type: Type.STRING },
                },
                required: ["type", "text", "visualPrompt"],
              }
            }
          },
          required: ["title", "pages", "extractedIdea"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI 无法从图片提取创意。");
    
    const data = JSON.parse(text.trim());
    return {
      title: data.title || "图片里的奇幻故事",
      extractedIdea: data.extractedIdea || "基于图片的灵感",
      pages: (data.pages || []).map((p: any, idx: number) => ({
        ...p,
        id: generateId(),
        pageNumber: idx + 1
      }))
    };
  } catch (error) {
    console.error("Image to Story Error:", error);
    throw error;
  }
};

export const generateNextPageSuggestion = async (context: string, currentStory: string): Promise<Partial<StoryPage>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `基于目前的故事背景: "${context}" 和已有的故事情节: "${currentStory}"，请构思绘本的下一个精彩页面内容。返回 JSON 包含 text (中文) 和 visualPrompt (英文)。`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          visualPrompt: { type: Type.STRING }
        },
        required: ["text", "visualPrompt"]
      }
    }
  });
  return JSON.parse(response.text?.trim() || '{}');
};

export const generateCharacterOptions = async (description: string, style: VisualStyle, referenceImageBase64?: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const promptText = `A single character concept: ${description}. White background. Style: ${style}. High consistency.`;
  const contents: any = { parts: [{ text: promptText }] };
  if (referenceImageBase64) {
    contents.parts.unshift({ inlineData: { data: referenceImageBase64.split(',')[1], mimeType: 'image/png' } });
  }
  const response = await ai.models.generateContent({ 
    model: 'gemini-2.5-flash-image', 
    contents, 
    config: { imageConfig: { aspectRatio: "1:1" } } 
  });
  const images: string[] = [];
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) { 
      if (part.inlineData) images.push(`data:image/png;base64,${part.inlineData.data}`); 
    }
  }
  return images;
};

export const generateSceneImage = async (pageText: string, visualPrompt: string, characterImageBase64: string, style: VisualStyle): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        { inlineData: { data: characterImageBase64.split(',')[1], mimeType: 'image/png' } },
        { text: `Illustration for: "${visualPrompt}". Main character attached for reference. Style: ${style}. 4K high quality.` }
      ]
    },
    config: { imageConfig: { aspectRatio: "4:3" } }
  });
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) { 
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`; 
    }
  }
  throw new Error("场景图生成失败。");
};

export const generateStoryVideo = async (title: string, summary: string, onProgress: (msg: string) => void): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  onProgress("正在初始化电影引擎...");
  let operation = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: `Cinematic story movie trailer for "${title}". ${summary}. Animated style.`,
    config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
  });
  while (!operation.done) {
    onProgress("正在绘制电影帧...");
    await new Promise(resolve => setTimeout(resolve, 10000));
    operation = await ai.operations.getVideosOperation({operation: operation});
  }
  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  return `${downloadLink}&key=${process.env.API_KEY}`;
};
