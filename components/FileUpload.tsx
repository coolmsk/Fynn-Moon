import React, { useState, useEffect } from 'react';
import { UploadIcon, PdfIcon } from './icons';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (selectedFile: File | null) => {
      if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
      }
      
      if (selectedFile) {
          const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
          if (allowedTypes.includes(selectedFile.type)) {
              setFile(selectedFile);
              onFileSelect(selectedFile);
              if (selectedFile.type.startsWith('image/')) {
                  setPreviewUrl(URL.createObjectURL(selectedFile));
              }
          } else {
              alert('지원하지 않는 파일 형식입니다. JPG, PNG, WEBP, PDF 파일만 업로드할 수 있습니다.');
              setFile(null);
              onFileSelect(null);
          }
      } else {
          setFile(null);
          onFileSelect(null);
      }
  };

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileChange(e.target.files[0]);
    }
  };
  
  if (file) {
    return (
       <div className="w-full flex flex-col items-center p-4 border rounded-lg bg-slate-50 dark:bg-slate-700/50 dark:border-slate-600">
         <div className="flex items-center gap-4 w-full">
            <div className="flex-shrink-0">
              {file.type.startsWith('image/') && previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="h-16 w-16 object-cover rounded-md" />
              ) : (
                  <div className="h-16 w-16 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-md">
                    <PdfIcon />
                  </div>
              )}
            </div>
            <div className="text-left overflow-hidden">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
         </div>
          <button
            onClick={() => handleFileChange(null)}
            className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
          >
            파일 변경
          </button>
        </div>
    );
  }

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={`w-full p-8 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors duration-200 ${
        isDragging ? 'border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-500/10' : 'border-slate-300 hover:border-indigo-500 dark:border-slate-600 dark:hover:border-indigo-400'
      }`}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*,application/pdf"
        onChange={handleInputChange}
      />
      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
        <UploadIcon />
        <p className="mt-2 text-slate-600 dark:text-slate-400 font-semibold">파일을 드래그하거나 클릭하여 업로드</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">PNG, JPG, WEBP, PDF 형식 지원</p>
      </label>
    </div>
  );
};

export default FileUpload;