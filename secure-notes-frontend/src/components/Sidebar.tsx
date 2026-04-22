import React, { useState } from 'react';
import { FileText, Star, Trash2, Folder as FolderIcon, Plus, LogOut, Clock, X, Sun, Moon } from 'lucide-react';
import type { Folder } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  folders: Folder[];
  onAddFolder: (name: string) => void;
  onDeleteFolder: (id: number) => void;
  onLogout: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onMoveNoteToFolder: (noteId: number, folderId: number) => void;
}

export default function Sidebar({ activeTab, setActiveTab, folders, onAddFolder, onDeleteFolder, onLogout, isDark, onToggleTheme, onMoveNoteToFolder }: SidebarProps) {
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [draggedOverFolderId, setDraggedOverFolderId] = useState<number | null>(null);

  const handleAddFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      onAddFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleDeleteFolder = (e: React.MouseEvent, folderId: number) => {
    e.stopPropagation();
    if (confirm('Bu klasörü silmek istediğinize emin misiniz?\nİçindeki notlar silinmeyecek, sadece klasörsüz kalacak.')) {
      onDeleteFolder(folderId);
      if (activeTab === `folder_${folderId}`) {
        setActiveTab('all');
      }
    }
  };

  const navItems = [
    { id: 'all', label: 'Tüm Notlar', icon: <FileText className="w-5 h-5" /> },
    { id: 'recent', label: 'En Yeniler', icon: <Clock className="w-5 h-5" /> },
    { id: 'favorites', label: 'Favoriler', icon: <Star className="w-5 h-5" /> },
    { id: 'trash', label: 'Silinenler', icon: <Trash2 className="w-5 h-5" /> },
  ];

  return (
    <div className="w-72 bg-gray-50 dark:bg-[#1a1a1a] border-r border-gray-200 dark:border-gray-800 flex flex-col h-full shadow-inner z-20 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-gray-200/60 dark:border-gray-800 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-500" /> 
          iNotes
        </h1>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                activeTab === item.id 
                  ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className={activeTab === item.id ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Folders Section */}
        <div>
          <h3 className="px-3 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Klasörler</h3>
          <nav className="space-y-1">
            {folders.map(folder => {
              const isDragOver = draggedOverFolderId === folder.id;
              return (
                <div 
                  key={folder.id}
                  className="group flex items-center"
                  onDragOver={(e) => { e.preventDefault(); setDraggedOverFolderId(folder.id); }}
                  onDragLeave={() => setDraggedOverFolderId(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDraggedOverFolderId(null);
                    const noteId = e.dataTransfer.getData('noteId');
                    if (noteId) {
                      onMoveNoteToFolder(parseInt(noteId), folder.id);
                    }
                  }}
                >
                  <button
                    onClick={() => setActiveTab(`folder_${folder.id}`)}
                    className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all duration-200 ${
                      activeTab === `folder_${folder.id}` 
                        ? 'bg-blue-100/80 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'
                    } ${isDragOver ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/40 transform scale-[1.02]' : ''}`}
                  >
                    <FolderIcon className={`w-4 h-4 ${isDragOver ? 'text-blue-500 animate-pulse' : 'text-blue-400'}`} />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <button
                    onClick={(e) => handleDeleteFolder(e, folder.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 ml-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-all duration-200"
                    title="Klasörü Sil"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {isAddingFolder ? (
              <form onSubmit={handleAddFolder} className="px-3 mt-2">
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Klasör adı..."
                  className="w-full text-sm py-1.5 px-3 border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  onBlur={() => !newFolderName && setIsAddingFolder(false)}
                />
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingFolder(true)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 transition-colors mt-1"
              >
                <Plus className="w-4 h-4" /> Klasör Ekle
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/60 dark:border-gray-800 space-y-1">
        <button 
          onClick={onToggleTheme}
          className="w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          title={isDark ? 'Aydınlık Mod' : 'Gece Modu'}
        >
          {isDark ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5" />}
        </button>
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5 opacity-70" />
          Çıkış Yap
        </button>
      </div>

    </div>
  );
}
