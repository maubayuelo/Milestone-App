import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  HardDrive, 
  Upload, 
  FileText, 
  Image as ImageIcon, 
  File, 
  Trash2, 
  Download, 
  ExternalLink,
  ShieldCheck,
  Folder,
  Filter
} from 'lucide-react';
import { AttachedFile, Project } from '../types';

interface ProjectFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  selectedProjectId: string;
  onSelectProjectId: (id: string) => void;
  files: AttachedFile[];
  onUploadFile: (file: AttachedFile) => void;
  onDeleteFile: (fileId: string) => void;
  onOpenFileInLightbox: (file: AttachedFile) => void;
}

export const ProjectFilesModal: React.FC<ProjectFilesModalProps> = ({
  isOpen,
  onClose,
  projects,
  selectedProjectId,
  onSelectProjectId,
  files,
  onUploadFile,
  onDeleteFile,
  onOpenFileInLightbox,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'pdf' | 'document'>('all');
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  // Files for this project (either entityId matches project or entityType is task belonging to this project)
  const projectFiles = useMemo(() => {
    return files.filter((f) => {
      const matchProject = f.entityId === currentProject?.id || f.entityName.includes(currentProject?.name.split('—')[0].trim());
      if (!matchProject && f.entityType !== 'calendar') {
        // Also check if matches project id
        return f.entityId === selectedProjectId;
      }
      return matchProject;
    });
  }, [files, currentProject, selectedProjectId]);

  // Filtered by search and type
  const filteredFiles = useMemo(() => {
    return projectFiles.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            f.entityName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || f.fileType === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [projectFiles, searchQuery, typeFilter]);

  // Calculate project storage used
  const totalBytes = projectFiles.reduce((acc, f) => acc + f.sizeBytes, 0);
  const totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const quotaMB = 500;
  const usagePercent = Math.min(100, Math.round((totalBytes / (quotaMB * 1024 * 1024)) * 100));

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      processNewFile(dropped);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processNewFile(e.target.files[0]);
    }
  };

  const processNewFile = (f: File) => {
    if (f.size > 10 * 1024 * 1024) {
      alert('File exceeds 10MB limit.');
      return;
    }

    const ext = f.name.split('.').pop()?.toLowerCase() || '';
    let fType: 'image' | 'pdf' | 'document' = 'document';
    if (['png', 'jpg', 'jpeg', 'heic'].includes(ext)) fType = 'image';
    else if (ext === 'pdf') fType = 'pdf';

    const url = URL.createObjectURL(f);
    const sizeFormatted = (f.size / (1024 * 1024)).toFixed(1) + ' MB';

    const newAttachedFile: AttachedFile = {
      id: `file-${Date.now()}`,
      name: f.name,
      sizeBytes: f.size,
      sizeFormatted,
      fileType: fType,
      extension: ext,
      url,
      thumbnailUrl: fType === 'image' ? url : undefined,
      pageCount: fType === 'pdf' ? 1 : undefined,
      uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      entityType: 'project',
      entityId: currentProject.id,
      entityName: currentProject.name,
    };

    onUploadFile(newAttachedFile);
  };

  return (
    <div 
      id="project-files-modal-backdrop"
      className="fixed inset-0 z-60 bg-black/60 flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div 
        id="project-files-modal"
        className="bg-white rounded-xl border border-[#E5E4E0] max-w-3xl w-full max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5E4E0] flex items-center justify-between shrink-0 bg-[#FAF9F7]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#F4F3F0] border border-[#E5E4E0] flex items-center justify-center text-[#1A1918]">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium text-[#1A1918]">
                  Project Files & Storage
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-[#F4F3F0] text-[#787774] border border-[#E5E4E0]">
                  Supabase RLS
                </span>
              </div>
              <p className="text-xs text-[#787774]">
                Scoped to project members · Guests have no external access
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#787774] hover:text-[#1A1918] hover:bg-[#F4F3F0] transition-colors duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selector & Storage Metric Bar */}
        <div className="px-6 py-3.5 bg-white border-b border-[#E5E4E0] space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Folder className="w-4 h-4 text-[#787774]" />
              <span className="text-xs text-[#787774]">Project:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => onSelectProjectId(e.target.value)}
                className="text-xs font-medium text-[#1A1918] bg-[#FAF9F7] border border-[#E5E4E0] rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer hover:bg-[#F4F3F0] transition-colors duration-200 max-w-xs truncate"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Storage Quota Gauge */}
            <div className="flex items-center gap-3">
              <div className="w-40 sm:w-48 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#787774]">Storage Used</span>
                  <span className="font-mono tabular-nums font-medium text-[#1A1918]">{totalMB} MB / {quotaMB} MB</span>
                </div>
                <div className="w-full h-1.5 bg-[#F4F3F0] rounded-full overflow-hidden flex">
                  <div 
                    style={{ width: `${Math.max(4, usagePercent)}%` }} 
                    className={`rounded-full ${usagePercent > 80 ? 'bg-[#C5221F]' : 'bg-[#1A1918]'}`}
                  />
                </div>
              </div>
              
              <label 
                htmlFor="project-file-upload-input"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A1918] hover:bg-[#2E2D2B] text-white text-xs font-medium transition-colors duration-200 cursor-pointer shrink-0"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
                <input 
                  id="project-file-upload-input" 
                  type="file" 
                  className="hidden" 
                  accept=".png,.jpg,.jpeg,.heic,.pdf,.docx,.md,.txt,image/*"
                  onChange={handleFileInput}
                />
              </label>
            </div>
          </div>

          {/* RLS Badge & Info */}
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[#FAF9F7] border border-[#E5E4E0] text-xs text-[#787774]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1A1918] shrink-0" />
            <span>
              <strong>Supabase Storage Rule:</strong> Scoped to <code className="text-[#1A1918] bg-white px-1 py-0.5 rounded border border-[#E5E4E0] font-mono text-[11px]">project_members</code>.
            </span>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="px-6 py-2.5 bg-[#FAF9F7] border-b border-[#E5E4E0] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#787774] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files by name or attached entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E5E4E0] focus:outline-none focus:border-[#1A1918] text-[#1A1918]"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-[#E5E4E0]">
            {(['all', 'image', 'pdf', 'document'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors duration-200 cursor-pointer ${
                  typeFilter === type
                    ? 'bg-[#1A1918] text-white font-medium'
                    : 'text-[#787774] hover:bg-[#F4F3F0] hover:text-[#1A1918]'
                }`}
              >
                {type === 'all' ? 'All Files' : type === 'image' ? 'Images' : type === 'pdf' ? 'PDFs' : 'Docs'}
              </button>
            ))}
          </div>
        </div>

        {/* Files List */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {isDragging && (
            <div className="absolute inset-0 bg-[#FAF9F7]/95 border-2 border-dashed border-[#1A1918] rounded-xl flex flex-col items-center justify-center text-[#1A1918] z-20 m-4">
              <Upload className="w-10 h-10 mb-2" />
              <span className="font-medium text-sm">Drop file to upload to {currentProject.name}</span>
              <span className="text-xs text-[#787774]">Max 10MB · PNG, JPG, PDF, DOCX, MD, TXT</span>
            </div>
          )}

          {filteredFiles.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-[#787774] space-y-2">
              <File className="w-10 h-10 text-[#D6D4CF] stroke-[1.5]" />
              <p className="text-xs font-medium text-[#1A1918]">
                {searchQuery ? 'No files match your search' : 'No files attached to this project yet'}
              </p>
              <p className="text-xs text-[#787774] max-w-xs text-center">
                Drag and drop files here, attach them in the Coach panel, or click Upload above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredFiles.map((file) => (
                <div
                  key={file.id}
                  className="p-3 rounded-xl border border-[#E5E4E0] bg-white hover:border-[#1A1918] transition-colors duration-200 group flex items-start gap-3"
                >
                  {/* Thumbnail or File Icon */}
                  {file.fileType === 'image' ? (
                    <div 
                      onClick={() => onOpenFileInLightbox(file)}
                      className="w-14 h-14 rounded-lg bg-[#F4F3F0] overflow-hidden border border-[#E5E4E0] shrink-0 cursor-pointer relative group/img"
                    >
                      <img 
                        src={file.url} 
                        alt={file.name} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : file.fileType === 'pdf' ? (
                    <div className="w-14 h-14 rounded-lg border border-[#E5E4E0] flex flex-col items-center justify-center text-[#C5221F] shrink-0">
                      <FileText className="w-6 h-6" />
                      <span className="text-[9px] font-medium mt-0.5">PDF</span>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-lg border border-[#E5E4E0] flex flex-col items-center justify-center text-[#1A1918] shrink-0">
                      <File className="w-6 h-6" />
                      <span className="text-[9px] font-medium mt-0.5 uppercase">{file.extension}</span>
                    </div>
                  )}

                  {/* File Metadata */}
                  <div className="flex-1 min-w-0">
                    <h4 
                      onClick={() => {
                        if (file.fileType === 'image') onOpenFileInLightbox(file);
                      }}
                      className={`text-xs font-medium text-[#1A1918] truncate ${file.fileType === 'image' ? 'cursor-pointer hover:underline' : ''}`}
                      title={file.name}
                    >
                      {file.name}
                    </h4>
                    
                    <div className="flex items-center gap-1.5 text-[11px] text-[#787774] mt-1 font-mono tabular-nums">
                      <span>{file.sizeFormatted}</span>
                      {file.pageCount && (
                        <>
                          <span>•</span>
                          <span>{file.pageCount} pages</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{file.uploadedAt}</span>
                    </div>

                    <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[#FAF9F7] text-[#787774] border border-[#E5E4E0] max-w-full truncate">
                      <span className="text-[#9D9C98]">Attached to:</span>
                      <span className="font-medium text-[#1A1918] truncate">{file.entityName}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    {file.fileType === 'image' && (
                      <button
                        onClick={() => onOpenFileInLightbox(file)}
                        className="p-1.5 rounded-md text-[#787774] hover:text-[#1A1918] hover:bg-[#F4F3F0] transition-colors duration-200 cursor-pointer"
                        title="View image"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <a
                      href={file.url}
                      download={file.name}
                      className="p-1.5 rounded-md text-[#787774] hover:text-[#1A1918] hover:bg-[#F4F3F0] transition-colors duration-200 cursor-pointer"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => onDeleteFile(file.id)}
                      className="p-1.5 rounded-md text-[#787774] hover:text-[#C5221F] hover:bg-[#F4F3F0] transition-colors duration-200 cursor-pointer"
                      title="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E5E4E0] bg-[#FAF9F7] flex items-center justify-between text-xs text-[#787774] shrink-0">
          <span className="font-mono tabular-nums">{filteredFiles.length} files shown</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#1A1918] hover:bg-[#2E2D2B] text-white font-medium transition-colors duration-200 cursor-pointer text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
