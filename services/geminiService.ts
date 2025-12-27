
import { GoogleGenAI, Type } from "@google/genai";
import { StoryTemplate, StoryPage, VisualStyle } from "../types";

const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * 助手函数：从 Data URL 中提取 base64 数据和 mimeType
 */
const parseBase64 = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) return { mimeType: 'image/png', data: dataUrl };
  return { mimeType: matches[1], data: matches[2] };
};

/**
 * 每次调用时实例化，确保能够获取到最新的环境变量中的 API Key。
 */
const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API 密钥配置缺失，请检查环境变量或点击主页按钮重新初始化。");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateStoryScript = async (idea: string, template: StoryTemplate): Promise<{ title: string; pages: StoryPage[] }> => {
  const ai = getAI();
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
    if (!text) throw new Error("AI 返回了空响应，请重试。");
    
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    return {
      title: data.title || "未命名故事",
      pages: (data.pages || []).map((p: any, idx: number) => ({
        ...p,
        id: generateId(),
        pageNumber: idx + 1
      }))
    };
  } catch (error: any) {
    console.error("Story Generation Error:", error);
    throw new Error(error.message || "生成故事脚本失败。");
  }
};

export const generateStoryFromImage = async (base64Image: string, mimeType: string, template: StoryTemplate): Promise<{ title: string; pages: StoryPage[]; extractedIdea: string }> => {
  const ai = getAI();
  try {
    const { data: imageData, mimeType: detectedMime } = parseBase64(base64Image);
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: imageData, mimeType: detectedMime || mimeType } },
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
    if (!text) throw new Error("AI 无法识别图片中的灵感。");
    
    const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);

    return {
      title: data.title || "图片里的奇幻故事",
      extractedIdea: data.extractedIdea || "基于图片的灵感",
      pages: (data.pages || []).map((p: any, idx: number) => ({
        ...p,
        id: generateId(),
        pageNumber: idx + 1
      }))
    };
  } catch (error: any) {
    console.error("Image to Story Error:", error);
    throw new Error(error.message || "分析图片失败。");
  }
};

export const generateCharacterOptions = async (description: string, style: VisualStyle, referenceImageBase64?: string): Promise<string[]> => {
  const ai = getAI();
  const promptText = `Character design sheet for a children's book. Description: ${description}. Clear character focus. White background. Style: ${style}. High consistency, vibrant colors, no text on image.`;
  
  const parts: any[] = [{ text: promptText }];
  if (referenceImageBase64) {
    const { data, mimeType } = parseBase64(referenceImageBase64);
    parts.unshift({ inlineData: { data, mimeType } });
  }

  try {
    const response = await ai.models.generateContent({ 
      model: 'gemini-2.5-flash-image', 
      contents: { parts }, 
      config: { imageConfig: { aspectRatio: "1:1" } } 
    });

    const images: string[] = [];
    const candidates = response.candidates;
    
    if (candidates && candidates.length > 0 && candidates[0].content?.parts) {
      for (const part of candidates[0].content.parts) { 
        if (part.inlineData) {
          images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`); 
        }
      }
    }

    if (images.length === 0) {
      throw new Error("模型未返回任何图像内容。这可能是由于内容安全过滤导致的，请尝试修改您的描述词。");
    }

    return images;
  } catch (error: any) {
    console.error("Character Generation Error:", error);
    throw error;
  }
};

export const generateSceneImage = async (pageText: string, visualPrompt: string, characterImageBase64: string, style: VisualStyle): Promise<string> => {
  const ai = getAI();
  const { data: charData, mimeType: charMime } = parseBase64(characterImageBase64);
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: charData, mimeType: charMime } },
          { text: `Illustration for a children's book. Context: "${pageText}". Scene details: "${visualPrompt}". The attached character MUST be the main hero. Style: ${style}. 4K, high detail.` }
        ]
      },
      config: { imageConfig: { aspectRatio: "4:3" } }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) { 
        if (part.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`; 
      }
    }
    throw new Error("无法生成页面图像。请稍后重试。");
  } catch (error: any) {
    console.error("Scene Generation Error:", error);
    throw error;
  }
};

export const generateStoryVideo = async (title: string, summary: string, onProgress: (msg: string) => void): Promise<string> => {
  const ai = getAI();
  onProgress("正在初始化电影引擎...");
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `Cinematic story movie trailer for "${title}". ${summary}. Animated style, smooth transitions, professional lighting.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      onProgress("正在绘制电影帧 (此过程较慢，请耐心等待)...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("视频生成结束但未找到链接。");
    return `${downloadLink}&key=${process.env.API_KEY}`;
  } catch (error: any) {
    console.error("Video Generation Error:", error);
    throw error;
  }
};

export const generateNextPageSuggestion = async (context: string, currentStory: string): Promise<Partial<StoryPage>> => {
  const ai = getAI();
  try {
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
    const cleanJson = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanJson || '{}');
  } catch (error) {
    console.error("Next Page Suggestion Error:", error);
    return { text: "新的一页展开了...", visualPrompt: "The character in a new peaceful setting" };
  }
};
