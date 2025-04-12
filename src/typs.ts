export type Book = {
    name: string;
    local_title: string;
    chapters: Chapter[];
    book_name: string;
    book_usfm: string;
    
  };

  
  export type Chapter = {
    chapter_usfm: string;
    is_chapter: boolean;
    chapter_text: string;
    items: ChapterItem[];
  };
  
  export type ChapterItem = {
    type: ChapterItemType;
    verse_numbers: number[];
    lines?: string[];
    text?: string;
  };


  export interface VerseItem {
    type: 'verse';
    verse_numbers: number[];
    lines: string[];
    text?: string; 
}
  
  export type ChapterItemType = "section1" | "section2" | "heading1" | "heading2" | "label" | "verse";
  