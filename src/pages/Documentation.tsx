import { useState, useEffect, useMemo } from "react";
import { Search, ChevronRight, ChevronDown, Code, Database, FileText, Menu, X, Home, Filter } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Badge } from "@/app/components/ui/badge";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo.jpg";
import type { DocumentationData, DocFile } from "@/types/documentation";

export default function Documentation() {
  const navigate = useNavigate();
  const [docsData, setDocsData] = useState<DocumentationData | null>(null);
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'backend' | 'frontend' | 'other'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Load documentation data
  useEffect(() => {
    async function loadDocs() {
      try {
        const response = await fetch('/data/documentation.json');
        const data = await response.json();
        setDocsData(data);
        
        // Expand first section by default
        if (data.categories && Object.keys(data.categories).length > 0) {
          const firstSection = Object.keys(data.categories)[0];
          setExpandedSections({ [firstSection]: true });
        }
      } catch (error) {
        console.error('Failed to load documentation:', error);
      }
    }
    loadDocs();
  }, []);

  // Filter files based on search and category
  const filteredFiles = useMemo(() => {
    if (!docsData) return [];
    
    let files = docsData.files;
    
    // Filter by category
    if (categoryFilter !== 'all') {
      files = files.filter(f => f.category === categoryFilter);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      files = files.filter(f => 
        f.displayName.toLowerCase().includes(query) ||
        f.fileName.toLowerCase().includes(query) ||
        f.section.toLowerCase().includes(query) ||
        f.path.toLowerCase().includes(query)
      );
    }
    
    return files;
  }, [docsData, searchQuery, categoryFilter]);

  // Load markdown file content
  const loadFileContent = async (file: DocFile) => {
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'backend':
        return <Database className="w-4 h-4 text-emerald-600" />;
      case 'frontend':
        return <Code className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!docsData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#024639] via-[#025a49] to-[#024639] shadow-lg px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-white lg:hidden"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </motion.button>
          
          <img src={logo} alt="Logo" className="w-10 h-10 rounded-full" />
          <div>
            <h1 className="text-white text-lg sm:text-xl font-bold">API Documentation</h1>
            <p className="text-emerald-100 text-xs hidden sm:block">
              {docsData.stats.total} files indexed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/home')}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <Home className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 1024) && (
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="w-80 bg-white border-r border-gray-200 flex flex-col overflow-hidden fixed lg:relative h-[calc(100vh-60px)] z-40"
            >
              {/* Search */}
              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search documentation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-gray-300 focus:border-emerald-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={categoryFilter === 'all' ? 'default' : 'outline'}
                    className={`cursor-pointer ${categoryFilter === 'all' ? 'bg-[#024639] hover:bg-[#024639]' : ''}`}
                    onClick={() => setCategoryFilter('all')}
                  >
                    All ({docsData.stats.total})
                  </Badge>
                  <Badge
                    variant={categoryFilter === 'backend' ? 'default' : 'outline'}
                    className={`cursor-pointer ${categoryFilter === 'backend' ? 'bg-emerald-600 hover:bg-emerald-600' : ''}`}
                    onClick={() => setCategoryFilter('backend')}
                  >
                    Backend ({docsData.stats.backend})
                  </Badge>
                  <Badge
                    variant={categoryFilter === 'frontend' ? 'default' : 'outline'}
                    className={`cursor-pointer ${categoryFilter === 'frontend' ? 'bg-blue-600 hover:bg-blue-600' : ''}`}
                    onClick={() => setCategoryFilter('frontend')}
                  >
                    Frontend ({docsData.stats.frontend})
                  </Badge>
                </div>

                <div className="text-xs text-gray-500">
                  {filteredFiles.length} file{filteredFiles.length !== 1 ? 's' : ''} found
                </div>
              </div>

              {/* File Tree */}
              <div className="flex-1 overflow-y-auto p-4">
                {searchQuery.trim() ? (
                  // Search Results View
                  <div className="space-y-1">
                    {filteredFiles.map(file => (
                      <motion.button
                        key={file.id}
                        whileHover={{ x: 3, backgroundColor: 'rgba(2, 70, 57, 0.05)' }}
                        onClick={() => loadFileContent(file)}
                        className={`w-full text-left p-2 rounded-md flex items-start gap-2 transition-colors ${
                          selectedFile?.id === file.id ? 'bg-emerald-50 border border-emerald-200' : ''
                        }`}
                      >
                        {getCategoryIcon(file.category)}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {file.displayName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {file.section} {file.subsection && `> ${file.subsection}`}
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  // Category Tree View
                  <div className="space-y-2">
                    {Object.entries(docsData.categories).map(([categoryName, categoryData]) => {
                      const categoryFiles = docsData.files.filter(f => f.section === categoryName);
                      const visibleFiles = categoryFilter === 'all' 
                        ? categoryFiles 
                        : categoryFiles.filter(f => f.category === categoryFilter);
                      
                      if (visibleFiles.length === 0) return null;

                      return (
                        <div key={categoryName} className="space-y-1">
                          <motion.button
                            whileHover={{ x: 2 }}
                            onClick={() => toggleSection(categoryName)}
                            className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 text-sm font-semibold text-gray-700"
                          >
                            <motion.div
                              animate={{ rotate: expandedSections[categoryName] ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </motion.div>
                            <span className="flex-1 text-left">{categoryName}</span>
                            <Badge variant="secondary" className="text-xs">
                              {visibleFiles.length}
                            </Badge>
                          </motion.button>

                          <AnimatePresence>
                            {expandedSections[categoryName] && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-6 space-y-0.5 overflow-hidden"
                              >
                                {visibleFiles.slice(0, 50).map(file => (
                                  <motion.button
                                    key={file.id}
                                    whileHover={{ x: 3, backgroundColor: 'rgba(2, 70, 57, 0.05)' }}
                                    onClick={() => loadFileContent(file)}
                                    className={`w-full text-left p-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
                                      selectedFile?.id === file.id ? 'bg-emerald-50 border border-emerald-200' : ''
                                    }`}
                                  >
                                    {getCategoryIcon(file.category)}
                                    <span className="truncate">{file.displayName}</span>
                                  </motion.button>
                                ))}
                                {visibleFiles.length > 50 && (
                                  <p className="text-xs text-gray-500 p-2">
                                    + {visibleFiles.length - 50} more files...
                                  </p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {selectedFile ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-5xl mx-auto"
            >
              {/* File Header */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getCategoryIcon(selectedFile.category)}
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {selectedFile.displayName}
                      </h1>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <span>{selectedFile.section}</span>
                        {selectedFile.subsection && (
                          <>
                            <ChevronRight className="w-3 h-3" />
                            <span>{selectedFile.subsection}</span>
                          </>
                        )}
                      </div>
                      <div className="mt-2 text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                        {selectedFile.path}
                      </div>
                    </div>
                  </div>
                  <Badge className={
                    selectedFile.category === 'backend' ? 'bg-emerald-600' :
                    selectedFile.category === 'frontend' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }>
                    {selectedFile.category.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* File Content */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading content...</p>
                  </div>
                ) : (
                  <div className="prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {fileContent}
                    </pre>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-3xl mx-auto text-center py-20">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Select a file to view
              </h2>
              <p className="text-gray-600">
                Browse the documentation tree on the left or use the search to find specific files.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}