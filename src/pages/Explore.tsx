import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Code,
  Database,
  FileText,
  X,
  File,
  Check,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import documentationData from "@/data/documentation.json";

// Type definitions based on the JSON structure
interface DocumentationFile {
  displayName: string;
  fileName: string;
  mdFile: string;
  path: string;
  extension: string;
  category: string;
  id: number;
  section: string;
  subsection: string;
  text?: string;
}

interface Category {
  name: string;
  subsections: Record<string, unknown>;
  fileCount: number;
}

interface DocumentationData {
  categories: Record<string, Category>;
  files: DocumentationFile[];
  generatedAt: string;
}

const data: DocumentationData = documentationData as DocumentationData;

export default function Explore() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'alphabetical' | 'recent'>('alphabetical');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFile, setSelectedFile] = useState<DocumentationFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copiedPath, setCopiedPath] = useState(false);
  const [copiedCode, setCopiedCode] = useState<number | null>(null);
  const itemsPerPage = 12;

  // Copy to clipboard
  const copyToClipboard = async (text: string, type: 'path' | 'code', codeIndex?: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'path') {
        setCopiedPath(true);
        setTimeout(() => setCopiedPath(false), 2000);
      } else if (type === 'code' && codeIndex !== undefined) {
        setCopiedCode(codeIndex);
        setTimeout(() => setCopiedCode(null), 2000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Load markdown file content
  const loadFileContent = async (file: DocumentationFile) => {
    setLoading(true);
    setSelectedFile(file);
    
    try {
      const response = await fetch(`/docs/${file.mdFile}`);
      const content = await response.text();
      setFileContent(content);
    } catch (error) {
      console.error('Failed to load file:', error);
      setFileContent('# Error\n\nFailed to load documentation file.');
    } finally {
      setLoading(false);
    }
  };

  // Get unique sections for filtering
  const sections = useMemo(() => {
    const uniqueSections = new Set(data.files.map(f => f.section).filter(Boolean));
    return Array.from(uniqueSections).sort();
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(data.files.map(f => f.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, []);

  // Filter files
  const filteredFiles = useMemo(() => {
    let files = data.files;

    // Category filter
    if (categoryFilter !== 'all') {
      files = files.filter(f => f.category === categoryFilter);
    }

    // Section filter
    if (sectionFilter !== 'all') {
      files = files.filter(f => f.section === sectionFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f =>
        f.displayName?.toLowerCase().includes(query) ||
        f.fileName?.toLowerCase().includes(query) ||
        f.path?.toLowerCase().includes(query) ||
        f.section?.toLowerCase().includes(query) ||
        f.text?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortBy === 'alphabetical') {
      files = [...files].sort((a, b) => 
        (a.displayName || a.fileName).localeCompare(b.displayName || b.fileName)
      );
    }

    return files;
  }, [searchQuery, categoryFilter, sectionFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredFiles.length / itemsPerPage);
  const paginatedFiles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredFiles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredFiles, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, sectionFilter, sortBy]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'backend':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'frontend':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'other':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-4 h-4";
    switch (category) {
      case 'backend':
        return <Database className={iconClass} />;
      case 'frontend':
        return <Code className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const getSectionColor = (section: string) => {
    const colors: Record<string, string> = {
      'Controllers': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      'Services': 'bg-green-50 text-green-700 border-green-200',
      'Entities': 'bg-orange-50 text-orange-700 border-orange-200',
      'Repositories': 'bg-cyan-50 text-cyan-700 border-cyan-200',
      'Commands': 'bg-pink-50 text-pink-700 border-pink-200',
      'Events': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'Plugins': 'bg-violet-50 text-violet-700 border-violet-200',
    };
    return colors[section] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  // Parse markdown content into structured sections
  const parseMarkdownContent = (content: string) => {
    const sections = [];
    const lines = content.split('\n');
    let currentSection: any = null;
    let currentContent: string[] = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let mainTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.trim().startsWith('```')) {
        if (!inCodeBlock) {
          inCodeBlock = true;
          codeBlockContent = [];
        } else {
          inCodeBlock = false;
          if (currentSection) {
            currentSection.codeBlocks = currentSection.codeBlocks || [];
            currentSection.codeBlocks.push(codeBlockContent.join('\n'));
          }
          currentContent.push(`___CODE_BLOCK_${currentSection?.codeBlocks?.length - 1}___`);
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      if (line.startsWith('# ') && !line.startsWith('## ')) {
        mainTitle = line.replace('# ', '').trim();
        continue;
      }

      if (line.startsWith('## ')) {
        if (currentSection) {
          currentSection.content = currentContent.join('\n');
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace('## ', '').trim(),
          content: '',
          codeBlocks: []
        };
        currentContent = [];
      } else if (currentSection) {
        currentContent.push(line);
      }
    }

    if (currentSection) {
      currentSection.content = currentContent.join('\n');
      sections.push(currentSection);
    }

    return sections;
  };

  // Render formatted content
  const renderFormattedContent = (content: string, codeBlocks?: string[]) => {
    const parts = content.split(/___CODE_BLOCK_(\d+)___/);
    
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        const blockIndex = parseInt(part);
        const code = codeBlocks?.[blockIndex] || '';
        return (
          <div key={idx} className="relative group">
            <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
              <code>{code}</code>
            </pre>
            <button
              onClick={() => copyToClipboard(code, 'code', blockIndex)}
              className="absolute top-2 right-2 px-2 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
            >
              {copiedCode === blockIndex ? (
                <>
                  <Check className="w-3 h-3" />
                  Copied!
                </>
              ) : (
                'Copy'
              )}
            </button>
          </div>
        );
      }
      
      return (
        <div key={idx} className="prose prose-sm max-w-none">
          {part.split('\n').map((line, lineIdx) => {
            if (!line.trim()) return <br key={lineIdx} />;
            if (line.startsWith('- ')) {
              return (
                <li key={lineIdx} className="ml-4">
                  {line.substring(2)}
                </li>
              );
            }
            if (line.startsWith('**') && line.endsWith('**')) {
              return (
                <p key={lineIdx} className="font-semibold text-gray-900">
                  {line.replace(/\*\*/g, '')}
                </p>
              );
            }
            return (
              <p key={lineIdx} className="text-gray-700 leading-relaxed">
                {line}
              </p>
            );
          })}
        </div>
      );
    });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setSectionFilter('all');
    setCurrentPage(1);
  };

  // Navigate to previous/next file
  const navigateToPrevFile = () => {
    if (!selectedFile) return;
    const currentIndex = filteredFiles.findIndex(f => f.id === selectedFile.id);
    if (currentIndex > 0) {
      loadFileContent(filteredFiles[currentIndex - 1]);
    }
  };

  const navigateToNextFile = () => {
    if (!selectedFile) return;
    const currentIndex = filteredFiles.findIndex(f => f.id === selectedFile.id);
    if (currentIndex < filteredFiles.length - 1) {
      loadFileContent(filteredFiles[currentIndex + 1]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/20 to-gray-50 flex flex-col">
      <Navigation />
      <div className="pt-16">

      {/* Hero */}
      <section className="pt-24 pb-12 bg-gradient-to-br from-[#024639] via-[#025a49] to-[#024639]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              Documentation Explorer
            </h1>
            <p className="text-xl text-emerald-100 max-w-3xl mx-auto mb-6">
              Browse {data.files.length.toLocaleString()} documented files across {Object.keys(data.categories).length} categories
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              {Object.entries(data.categories).map(([key, cat]) => (
                <div key={key} className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <span className="font-semibold">{cat.name}:</span>{' '}
                  <span className="text-emerald-200">{cat.fileCount}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Search Bar, Filters, and Pagination - Top - NOT STICKY */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Row 1: Search + Pagination */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
            {/* Search Bar */}
            <div className="relative flex-1 max-w-xl w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, path, section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-gray-50 border-gray-300 w-full text-base"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-600 whitespace-nowrap">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Prev</span>
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Row 2: Horizontal Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Category:
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="all">All categories ({categories.length})</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Section Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Section:
              </label>
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="all">All sections ({sections.length})</option>
                {sections.map(section => (
                  <option key={section} value={section}>
                    {section || 'Other'}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                Sort:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-w-[180px]"
              >
                <option value="alphabetical">Alphabetical (A → Z)</option>
                <option value="recent">File ID</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchQuery || categoryFilter !== 'all' || sectionFilter !== 'all') && (
              <Button
                onClick={clearFilters}
                variant="ghost"
                size="sm"
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 ml-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Results Info */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredFiles.length)} of {filteredFiles.length.toLocaleString()} files
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Main Content Area - Split View - MODIFIED LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: File List - Takes 3 columns (narrower) */}
          <div className="lg:col-span-3 space-y-4">
            {/* Results Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">Files</span>
                <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">
                  {filteredFiles.length.toLocaleString()}
                </Badge>
              </div>
              {(searchQuery || categoryFilter !== 'all' || sectionFilter !== 'all') && (
                <Button
                  onClick={clearFilters}
                  variant="ghost"
                  size="sm"
                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </motion.div>

            {/* Results Info */}
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages} • {filteredFiles.length.toLocaleString()} total
            </div>

            {/* File List */}
            <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
              {paginatedFiles.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                  <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Documents Found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search query or filters
                  </p>
                  <Button onClick={clearFilters} variant="outline">
                    Clear All Filters
                  </Button>
                </div>
              ) : (
                paginatedFiles.map((file, idx) => (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    onClick={() => loadFileContent(file)}
                    className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
                      selectedFile?.id === file.id 
                        ? 'border-emerald-500 bg-emerald-50/30' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="p-3">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-1">
                          {getCategoryIcon(file.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xs font-semibold text-gray-900 mb-1 truncate">
                            {file.displayName || file.fileName}
                          </h3>
                          <div className="flex flex-wrap gap-1 mb-1">
                            <Badge
                              variant="outline"
                              className={`text-xs px-1 py-0 ${getCategoryColor(file.category)} border`}
                            >
                              {file.category}
                            </Badge>
                            {file.section && (
                              <Badge
                                variant="outline"
                                className={`text-xs px-1 py-0 ${getSectionColor(file.section)} border`}
                              >
                                {file.section}
                              </Badge>
                            )}
                          </div>
                          
                          {file.text && (
                            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                              {file.text}
                            </p>
                          )}
                          
                          <p className="text-xs text-gray-500 truncate">
                            {file.path}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                <Button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Prev
                </Button>
                
                <span className="text-sm text-gray-600">
                  {currentPage} / {totalPages}
                </span>

                <Button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Right: Preview Panel - Takes 9 columns (wider) */}
          <div className="lg:col-span-9">
            {selectedFile ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* File Header with Navigation */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  {/* Navigation Bar */}
                  <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={navigateToPrevFile}
                        disabled={!selectedFile || filteredFiles.findIndex(f => f.id === selectedFile.id) === 0}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-emerald-50 text-sm">
                        {selectedFile ? filteredFiles.findIndex(f => f.id === selectedFile.id) + 1 : 0} / {filteredFiles.length}
                      </span>
                      <Button
                        onClick={navigateToNextFile}
                        disabled={!selectedFile || filteredFiles.findIndex(f => f.id === selectedFile.id) === filteredFiles.length - 1}
                        variant="ghost"
                        size="sm"
                        className="text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                    <Badge className="bg-white/20 text-white border-white/30">
                      {selectedFile.category.toUpperCase()}
                    </Badge>
                  </div>

                  {/* File Info */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        {getCategoryIcon(selectedFile.category)}
                        <div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-1">
                            {selectedFile.displayName}
                          </h2>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>{selectedFile.section}</span>
                            {selectedFile.subsection && (
                              <>
                                <ChevronRight className="w-3 h-3" />
                                <span>{selectedFile.subsection}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  
                  {/* Beautiful Path Display */}
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#024639] via-emerald-700 to-[#024639] rounded-xl blur-sm opacity-20"></div>
                    <div className="relative bg-gradient-to-r from-[#024639] to-emerald-800 rounded-xl p-4 shadow-lg border border-emerald-900/20">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-sm">
                            <FileText className="w-4 h-4 text-emerald-200" />
                          </div>
                        </div>
                        <code className="text-sm font-mono text-emerald-50 font-medium tracking-wide flex-1 break-all">
                          {selectedFile.path}
                        </code>
                        <button
                          onClick={() => copyToClipboard(selectedFile.path, 'path')}
                          className="flex-shrink-0 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium text-emerald-100 transition-all duration-200 hover:shadow-md backdrop-blur-sm flex items-center gap-1.5"
                        >
                          {copiedPath ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied!
                            </>
                          ) : (
                            'Copy'
                          )}
                        </button>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>

                {/* File Content */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="text-center py-12">
                        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                        <p className="text-gray-600">Loading content...</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const parsedSections = parseMarkdownContent(fileContent);
                        
                        // Only render sections that actually exist in the parsed content
                        return parsedSections.map((section, idx) => {
                          return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="bg-white rounded-lg border-2 border-gray-200 shadow-md overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          {/* Section Header with Icon */}
                          <div className="bg-white border-b-2 border-gray-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                section.title === 'Summary' ? 'bg-purple-100' :
                                section.title === 'Classes' ? 'bg-orange-100' :
                                section.title === 'Function Details' || section.title === 'Methods' ? 'bg-emerald-100' :
                                section.title === 'Parameters' ? 'bg-pink-100' :
                                section.title === 'Returns' ? 'bg-cyan-100' :
                                'bg-gray-100'
                              }`}>
                                {section.title === 'Summary' && <FileText className="w-5 h-5 text-purple-600" />}
                                {section.title === 'Classes' && <Database className="w-5 h-5 text-orange-600" />}
                                {(section.title === 'Function Details' || section.title === 'Methods') && <Code className="w-5 h-5 text-emerald-600" />}
                                {section.title === 'Parameters' && <ChevronRight className="w-5 h-5 text-pink-600" />}
                                {section.title === 'Returns' && <ChevronRight className="w-5 h-5 text-cyan-600" />}
                                {!['Summary', 'Classes', 'Function Details', 'Methods', 'Parameters', 'Returns'].includes(section.title) && 
                                  <FileText className="w-5 h-5 text-gray-600" />}
                              </div>
                              <h3 className="text-xl font-bold text-gray-900">
                                {section.title}
                              </h3>
                            </div>
                          </div>
                          
                          {/* Section Content */}
                          <div className="px-6 py-6 bg-gray-50">
                            <div className="space-y-3">
                              {renderFormattedContent(section.content, section.codeBlocks)}
                            </div>
                          </div>
                        </motion.div>
                          );
                        });
                      })()}
                    </>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-12 text-center h-full flex flex-col items-center justify-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Select a File
                </h3>
                <p className="text-gray-600">
                  Click on any file from the list to preview its documentation
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      <Footer />
    </div>
  );
}