
export enum StoryTemplate {
  HERO_JOURNEY = 'Hero\'s Journey',
  SEARCH_AND_FIND = 'Search & Find',
  BEDTIME_HEALING = 'Bedtime Healing',
  WACKY_ADVENTURE = 'Wacky Adventure'
}

export enum VisualStyle {
  WATERCOLOR = 'Soft Watercolor',
  CRAYON = 'Hand-drawn Crayon',
  PIXAR_3D = 'Modern 3D Animation',
  PAPER_CUT = 'Paper-cut Collage',
  OIL_PAINTING = 'Classic Oil Painting',
  GHIBLI = 'Ghibli Studio Anime',
  SHAUN_TAN = 'Shaun Tan Surrealism'
}

export type PageType = 'cover' | 'story' | 'back';

export interface StoryPage {
  id: string;
  type: PageType;
  pageNumber: number;
  text: string;
  visualPrompt: string;
  imageUrl?: string;
  isGenerating?: boolean;
}

export interface BookProject {
  id: string;
  title: string;
  originalIdea: string;
  template: StoryTemplate;
  pages: StoryPage[];
  characterDescription: string;
  characterReferenceImage?: string; 
  characterSeedImage?: string; 
  visualStyle: VisualStyle;
  currentStep: 'idea' | 'character' | 'director' | 'press';
  createdAt?: number;
}
