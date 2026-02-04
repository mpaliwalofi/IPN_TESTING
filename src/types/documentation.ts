// Documentation Type Definitions

export interface DocFile {
  id: number;
  displayName: string;
  fileName: string;
  mdFile: string;
  path: string;
  category: 'backend' | 'frontend' | 'other';
  section: string;
  subsection: string;
}

export interface DocSubsection {
  name: string;
  path: string[];
  files: number[];
}

export interface DocCategory {
  name: string;
  subsections: Record<string, DocSubsection>;
  fileCount: number;
}

export interface DocStats {
  total: number;
  backend: number;
  frontend: number;
  other: number;
}

export interface SearchIndexItem {
  id: number;
  text: string;
  category: 'backend' | 'frontend' | 'other';
}

export interface DocumentationData {
  categories: Record<string, DocCategory>;
  files: DocFile[];
  stats: DocStats;
  searchIndex: SearchIndexItem[];
  generatedAt: string;
}

export interface FilterOptions {
  category?: 'all' | 'backend' | 'frontend' | 'other';
  section?: string;
  searchQuery?: string;
}