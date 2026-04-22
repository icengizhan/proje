export type PaperType = 'blank' | 'lined' | 'grid' | 'dots';
export type PaperColor = 'white' | 'yellow' | 'gray';

export interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  folderId: number | null;
  isPinned: boolean;
  isDeleted: boolean;
  isLocked: boolean;
  isFavorite: boolean;
  paperType: PaperType;
  paperColor: PaperColor;
}

export interface Folder {
  id: number;
  name: string;
}
