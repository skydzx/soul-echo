import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { avatarApi } from '@/services/api';

interface AvatarUploaderProps {
  characterId: string;
  currentAvatar?: string;
  onAvatarUpdate: (newAvatar: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const SIZE_CLASSES = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24',
  lg: 'w-32 h-32',
  xl: 'w-40 h-40',
};

const ICON_SIZES = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

export default function AvatarUploader({
  characterId,
  currentAvatar,
  onAvatarUpdate,
  size = 'lg',
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 显示预览
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // 上传头像
    setUploading(true);
    try {
      const response = await avatarApi.upload(characterId, file);
      onAvatarUpdate(response.url);
    } catch (error) {
      console.error('头像上传失败:', error);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!currentAvatar && !preview) return;

    try {
      await avatarApi.delete(characterId);
      setPreview(null);
      onAvatarUpdate('');
    } catch (error) {
      console.error('头像删除失败:', error);
    }
  };

  const displayAvatar = preview || currentAvatar;
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  return (
    <div className="relative inline-block">
      <div
        className={`${SIZE_CLASSES[size]} rounded-2xl bg-gradient-to-br from-primary-400 to-pink-400 flex items-center justify-center overflow-hidden cursor-pointer group`}
        onClick={() => fileInputRef.current?.click()}
      >
        {displayAvatar ? (
          <img
            src={displayAvatar.startsWith('http') ? displayAvatar : `${API_BASE}${displayAvatar}`}
            alt="头像"
            className="w-full h-full object-cover"
          />
        ) : (
          <Camera className={`${ICON_SIZES[size]} text-white/80`} />
        )}

        {/* 悬停遮罩 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Upload className="w-8 h-8 text-white" />
        </div>

        {/* 上传中状态 */}
        {uploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* 删除按钮 */}
      {displayAvatar && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
