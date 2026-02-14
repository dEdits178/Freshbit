import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/helpers';

const FileUpload = ({
  onFileSelect,
  acceptedTypes = ['.csv', '.xlsx'],
  maxSize = 10 * 1024 * 1024,
  label,
  error,
  currentFile,
  onRemove
}) => {
  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxSize,
    multiple: false
  });

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}

      <AnimatePresence mode="wait">
        {currentFile ? (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center justify-between p-4 bg-green-50 border-2 border-green-200 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <File className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{currentFile.name}</p>
                <p className="text-xs text-gray-500">{(currentFile.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>

            {onRemove && (
              <button onClick={onRemove} className="p-1 hover:bg-green-100 rounded transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200',
              isDragActive && 'border-primary-500 bg-primary-50',
              isDragReject && 'border-red-500 bg-red-50',
              !isDragActive && !isDragReject && 'border-gray-300 hover:border-primary-400 hover:bg-gray-50',
              error && 'border-red-500'
            )}
          >
            <input {...getInputProps()} />

            <motion.div
              animate={{
                y: isDragActive ? -5 : 0,
                scale: isDragActive ? 1.05 : 1
              }}
              transition={{ duration: 0.2 }}
            >
              <Upload className={cn('w-12 h-12 mx-auto mb-4', isDragActive ? 'text-primary-600' : 'text-gray-400')} />

              <p className="text-sm font-medium text-gray-900 mb-1">
                {isDragActive ? 'Drop your file here' : 'Drag & drop your file here'}
              </p>

              <p className="text-xs text-gray-500 mb-3">or click to browse</p>

              <p className="text-xs text-gray-400">
                Accepted: {acceptedTypes.join(', ')} • Max size: {maxSize / 1024 / 1024}MB
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-2 text-sm text-red-600">
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default FileUpload;
