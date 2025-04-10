export type Book = {
    name: string;
    local_title: string;
    chapters: Chapter[];
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
    lines: string[];
  };
  
  export type ChapterItemType = "section1" | "section2" | "heading1" | "heading2" | "label" | "verse";
  