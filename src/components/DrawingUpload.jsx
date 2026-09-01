import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, X, FileText, Image, File } from 'lucide-react';

const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = {
  'application/pdf': 'PDF',
  'image/jpeg': 'JPG',
  'image/jpg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WEBP',
  'application/dwg': 'DWG',
  'application/dxf': 'DXF',
  'application/acad': 'DWG',
  'application/x-dwg': 'DWG',
  'application/x-dxf': 'DXF',
};

const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.webp,.dwg,.dxf';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type) {
  if (type === 'application/pdf') return FileText;
  if (type?.startsWith('image/')) return Image;
  return File;
}

function validateFile(file) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isAcceptedType = ACCEPTED_TYPES[file.type] || ['pdf', 'jpg', 'jpeg', 'png', 'webp', 'dwg', 'dxf'].includes(ext);

  if (!isAcceptedType) {
    return `"${file.name}" is not an accepted file type.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `"${file.name}" exceeds the 25 MB limit (${formatSize(file.size)}).`;
  }
  return null;
}

let fileIdCounter = 0;

export default function DrawingUpload({ files, onFilesChange, variant = 'light' }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);
  const dark = variant === 'dark';

  const addFiles = useCallback(
    (newFiles) => {
      const valid = [];
      const errors = [];

      for (const file of newFiles) {
        const err = validateFile(file);
        if (err) {
          errors.push(err);
        } else {
          valid.push({
            id: `file-${++fileIdCounter}-${Date.now()}`,
            file,
            name: file.name,
            size: file.size,
            type: file.type,
            status: 'ready',
          });
        }
      }

      if (valid.length > 0) {
        onFilesChange([...files, ...valid]);
      }

      return errors;
    },
    [files, onFilesChange],
  );

  const removeFile = useCallback(
    (id) => {
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange],
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length > 0) {
        addFiles(droppedFiles);
      }
    },
    [addFiles],
  );

  const handleInputChange = useCallback(
    (e) => {
      const selected = Array.from(e.target.files);
      if (selected.length > 0) {
        addFiles(selected);
      }
      e.target.value = '';
    },
    [addFiles],
  );

  const getFileTypeLabel = (file) => {
    const ext = file.name.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-300 sm:p-8 ${
          isDragOver
            ? 'border-primary bg-primary/5 shadow-glow'
            : dark
              ? 'border-white/15 hover:border-primary/50 hover:bg-white/5'
              : 'border-line hover:border-primary/50 hover:bg-mist/60'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleInputChange}
          className="hidden"
          aria-label="Upload drawing files"
        />

        <div className="flex flex-col items-center gap-3">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 sm:h-16 sm:w-16 ${
              isDragOver
                ? 'bg-primary text-white shadow-glow'
                : dark
                  ? 'bg-primary/15 text-red-300 group-hover:bg-primary group-hover:text-white group-hover:shadow-glow'
                  : 'bg-red-50 text-primary group-hover:bg-primary group-hover:text-white group-hover:shadow-glow'
            }`}
          >
            <Paperclip className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>

          <div>
            <p className={`font-display text-base font-bold sm:text-lg ${dark ? 'text-white' : 'text-ink'}`}>
              Attach Drawings
            </p>
            <p className={`mt-1 text-sm ${dark ? 'text-white/60' : 'text-muted'}`}>
              Drag & drop your files here or{' '}
              <span className="font-semibold text-red-300">Browse Files</span>
            </p>
          </div>

          <p className={`text-xs ${dark ? 'text-white/45' : 'text-muted/70'}`}>
            PDF, JPG, PNG, DWG, DXF — Max 25 MB per file
          </p>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
            className="mt-1 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-6 py-3 text-sm font-semibold text-primary transition-all duration-300 hover:bg-primary hover:text-white hover:shadow-glow sm:px-8 sm:py-3.5"
          >
            <Paperclip className="h-4 w-4" />
            Choose Files
          </button>
        </div>
      </div>

      <p className={`px-1 text-xs ${dark ? 'text-white/45' : 'text-muted/60'}`}>
        Upload floor plans, roof plans, elevations, sections, or construction drawings.
      </p>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2 overflow-hidden"
          >
            {files.map((f) => {
              const Icon = getFileIcon(f.type);
              return (
                <motion.div
                  key={f.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 shadow-sm ${
                    dark ? 'border-white/15 bg-white/10' : 'border-line bg-white'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      dark ? 'bg-primary/15 text-red-300' : 'bg-red-50 text-primary'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${dark ? 'text-white' : 'text-ink'}`}>
                      {f.name}
                    </p>
                    <p className={`text-xs ${dark ? 'text-white/60' : 'text-muted'}`}>
                      {getFileTypeLabel(f.file)} · {formatSize(f.size)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
                      dark
                        ? 'text-white/60 hover:bg-red-500/20 hover:text-red-300'
                        : 'text-muted hover:bg-red-50 hover:text-red-500'
                    }`}
                    aria-label={`Remove ${f.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
