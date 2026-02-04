import { useState, useRef } from 'react';
import { Image, X, Upload, Loader2 } from 'lucide-react';
import { imageApi } from '@/services/api';

interface ImageUploaderProps {
  characterId: string;
  onImagesSelected: (urls: string[]) => void;
}

export default function ImageUploader({ characterId, onImagesSelected }: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;

      setUploading(true);
      try {
        const response = await imageApi.upload(characterId, file);
        newImages.push(response.url);
      } catch (error) {
        console.error('图片上传失败:', error);
      }
    }

    setUploading(false);

    if (newImages.length > 0) {
      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      onImagesSelected(updatedImages);
    }

    // 清空 input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesSelected(updatedImages);
  };

  return (
    <div className="space-y-2">
      {/* 图片预览 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-xl">
          {images.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || ''}${url}`}
                alt={`图片 ${index + 1}`}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 上传按钮 */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
            uploading
              ? 'bg-white/10 text-gray-400 cursor-not-allowed'
              : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>上传中...</span>
            </>
          ) : (
            <>
              <Image className="w-4 h-4" />
              <span>添加图片</span>
            </>
          )}
        </button>

        {/* 快捷表情包 */}
        <div className="flex gap-1">
          {['😀', '😂', '😍', '😊', '🥰', '😎', '🤔', '😴'].map((emoji) => (
            <button
              key={emoji}
              onClick={() => onImagesSelected([`emoji:${emoji}`])}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all text-lg"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
