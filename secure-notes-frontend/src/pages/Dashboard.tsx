import { useState, useEffect } from 'react';
import { Search, Plus, FileText, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

/* Components */
import Sidebar from '../components/Sidebar';
import NoteCard from '../components/NoteCard';
import Editor from '../components/Editor';

/* Types */
import type { Note, Folder } from '../types';


export default function Dashboard() {
  const navigate = useNavigate();
  
  // State 
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'recent', 'favorites', 'trash', or 'folder_X'
  const [searchQuery, setSearchQuery] = useState('');
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<number | null>(null);

  // Focus Mode states
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNoteListOpen, setIsNoteListOpen] = useState(true);
  const isFocusMode = !isSidebarOpen && !isNoteListOpen;

  const toggleFocusMode = () => {
    if (isFocusMode) {
      setIsSidebarOpen(true);
      setIsNoteListOpen(true);
    } else {
      setIsSidebarOpen(false);
      setIsNoteListOpen(false);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [notesRes, foldersRes] = await Promise.all([
          api.get('/notes'),
          api.get('/folders')
        ]);
        const mappedData = notesRes.data.map((n: any) => ({
          ...n,
          date: new Date(n.updated_at || n.created_at || Date.now()).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
        }));
        setNotes(mappedData);
        setFolders(foldersRes.data);
        if (mappedData.length > 0) setActiveNoteId(mappedData[0].id);
      } catch (err: any) {
        if (err.response?.status === 401) handleLogout();
      }
    };
    fetchAll();
  }, []);

  // App Actions
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleAddFolder = async (name: string) => {
    try {
      const response = await api.post('/folders', { name });
      setFolders(prev => [...prev, response.data]);
    } catch {
      alert('Klasör oluşturulurken bir hata oluştu.');
    }
  };

  const handleDeleteFolder = async (folderId: number) => {
    try {
      await api.delete(`/folders/${folderId}`);
      setFolders(prev => prev.filter(f => f.id !== folderId));
      // Nullify folderId on affected notes locally
      setNotes(prev => prev.map(n => n.folderId === folderId ? { ...n, folderId: null } : n));
    } catch {
      alert('Klasör silinirken bir hata oluştu.');
    }
  };

  const handleCreateNote = async () => {
    try {
      const isFolder = activeTab.startsWith('folder_');
      const payload: any = {
        title: 'Yeni Not',
        content: '',
        paperType: 'blank',
        paperColor: 'white'
      };
      if (isFolder) {
        payload.folderId = parseInt(activeTab.split('_')[1]);
      }
      
      const response = await api.post('/notes', payload);
      const newNote = {
        ...response.data,
        date: new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
      } as Note;
      setNotes([newNote, ...notes]);
      setActiveNoteId(newNote.id);
    } catch (err: any) {
      console.error("Not oluşturma hatası: ", err.response?.data || err);
      alert(`Sunucu hatası: ${err.response?.data?.message || 'Bağlantı kurulamadı'}`);
    }
  };

  // Note Actions
  const updateNote = (updated: Note) => {
    setNotes(notes.map(n => n.id === updated.id ? updated : n));
  };

  const togglePin = (id: number) => {
    const n = notes.find(x => x.id === id); if(!n) return;
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    api.patch(`/notes/${id}`, { isPinned: !n.isPinned }).catch(() => {});
  };

  const toggleFavorite = (id: number) => {
    const n = notes.find(x => x.id === id); if(!n) return;
    setNotes(notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
    api.patch(`/notes/${id}`, { isFavorite: !n.isFavorite }).catch(() => {});
  };

  const moveToTrash = (id: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isDeleted: true, isPinned: false, isFavorite: false } : n));
    api.patch(`/notes/${id}`, { isDeleted: true, isPinned: false, isFavorite: false }).catch(() => {});
  };

  const restoreNote = (id: number) => {
    setNotes(notes.map(n => n.id === id ? { ...n, isDeleted: false } : n));
    api.patch(`/notes/${id}`, { isDeleted: false }).catch(() => {});
  };

  const deletePermanently = (id: number) => {
    setNotes(notes.filter(n => n.id !== id));
    if (activeNoteId === id) setActiveNoteId(null);
  };

  const handleWikiLink = (linkName: string) => {
    const targetNote = notes.find(n => n.title.toLowerCase() === linkName.toLowerCase());
    if (targetNote) {
      if (targetNote.isDeleted) {
        setActiveTab('trash');
      } else if (targetNote.folderId) {
        setActiveTab(`folder_${targetNote.folderId}`);
      } else {
        setActiveTab('all');
      }
      setActiveNoteId(targetNote.id);
      setSearchQuery('');
    } else {
      alert(`"${linkName}" adında bir not bulunamadı.`);
    }
  };

  // Computed Filtered Notes
  const filteredNotes = notes.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'trash') return n.isDeleted;
    if (n.isDeleted) return false; // Hide deleted from other tabs

    if (activeTab === 'all') return true;
    if (activeTab === 'recent') return true; // Normally check dates, here all are recent
    if (activeTab === 'favorites') return n.isFavorite;
    if (activeTab.startsWith('folder_')) {
      return n.folderId === parseInt(activeTab.split('_')[1]);
    }
    return true;
  });

  // Sort: Pinned first
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const activeNote = notes.find(n => n.id === activeNoteId);

  return (
    <div className="flex h-screen bg-[#F6F7F9] overflow-hidden">
      
      {/* 1. Sidebar — collapsible */}
      <div
        className={`shrink-0 transition-all duration-300 ease-in-out overflow-hidden ${
          isSidebarOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'
        }`}
      >
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          folders={folders} 
          onAddFolder={handleAddFolder} 
          onDeleteFolder={handleDeleteFolder}
          onLogout={handleLogout} 
        />
      </div>

      {/* 2. List & Grid Area — collapsible */}
      <div
        className={`flex flex-col bg-[#F3F4F6] shrink-0 border-r border-gray-200 z-10 transition-all duration-300 ease-in-out overflow-hidden ${
          isNoteListOpen ? 'w-[480px] opacity-100' : 'w-0 opacity-0'
        }`}
      >
        
        {/* Header toolbar */}
        <div className="px-6 py-6 pb-4 min-w-[480px]">
           {/* Section Title */}
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-3xl font-black text-gray-800 tracking-tight capitalize">
              {activeTab === 'all' && 'Tüm Notlar'}
              {activeTab === 'recent' && 'En Yeniler'}
              {activeTab === 'favorites' && 'Favoriler'}
              {activeTab === 'trash' && 'Çöp Kutusu'}
              {activeTab.startsWith('folder_') && folders.find(f => f.id === parseInt(activeTab.split('_')[1]))?.name}
            </h2>
            <span className="bg-gray-200 text-gray-600 text-sm font-bold px-2 py-0.5 rounded-full">
              {sortedNotes.length}
            </span>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Notlarda ara..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm transition"
              />
            </div>
            
            {activeTab !== 'trash' && (
              <button 
                onClick={handleCreateNote}
                className="p-3 bg-blue-600 text-white rounded-xl shadow-md hover:bg-blue-700 transition flex items-center justify-center shrink-0 hover:shadow-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Real Grid Map */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-w-[480px]">
          {sortedNotes.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-gray-400 text-6xl mb-4 opacity-50">📂</div>
              <p className="text-gray-500 font-medium">Bu liste henüz boş.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {sortedNotes.map(note => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  isActive={activeNote?.id === note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  onTogglePin={() => togglePin(note.id)}
                  onToggleFavorite={() => toggleFavorite(note.id)}
                  onLinkClick={handleWikiLink}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Global Editor */}
      {activeNote ? (
        <Editor 
          note={activeNote} 
          onUpdate={updateNote}
          onDeletePermanently={deletePermanently}
          onRestore={restoreNote}
          onTrash={moveToTrash}
          onLinkClick={handleWikiLink}
          isFocusMode={isFocusMode}
          onToggleFocusMode={toggleFocusMode}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
          isNoteListOpen={isNoteListOpen}
          onToggleNoteList={() => setIsNoteListOpen(prev => !prev)}
        />
      ) : (
        <div className="flex-1 bg-white flex flex-col items-center justify-center border-l border-gray-200">
          <FileText className="w-24 h-24 text-gray-200 mb-6" />
          <h2 className="text-2xl font-bold text-gray-400">Not Görüntüleyici</h2>
          <p className="text-gray-400">Görüntülemek veya düzenlemek için bir not seçin.</p>
        </div>
      )}

    </div>
  );
}
