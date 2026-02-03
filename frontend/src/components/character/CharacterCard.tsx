import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import type { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  onDelete?: (id: string) => void;
}

export default function CharacterCard({ character, onDelete }: CharacterCardProps) {
  const genderEmoji = character.gender === '女性' ? '👩' : character.gender === '男性' ? '👨' : '🧑';

  return (
    <div className="glass rounded-2xl p-6 hover:bg-white/15 transition-all group">
      {/* 头像 */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-pink-400 rounded-2xl flex items-center justify-center text-3xl">
          {genderEmoji}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white">{character.name}</h3>
          <p className="text-gray-400 text-sm">{character.age}岁 · {character.gender}</p>
        </div>
      </div>

      {/* 标签 */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs">
          {character.relationship_type}
        </span>
        <span className="px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs">
          {character.personality.性格}
        </span>
        {character.hobbies.slice(0, 2).map((hobby) => (
          <span
            key={hobby}
            className="px-3 py-1 bg-white/10 text-gray-300 rounded-full text-xs"
          >
            {hobby}
          </span>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Link
          to={`/chat/${character.id}`}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary-500 to-pink-500 rounded-xl text-white font-medium hover:shadow-lg hover:shadow-primary-500/30 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>对话</span>
        </Link>
        <Link
          to={`/profile/${character.id}`}
          className="flex items-center justify-center px-4 py-2.5 bg-white/10 rounded-xl text-white font-medium hover:bg-white/20 transition-all"
        >
          <Heart className="w-4 h-4" />
        </Link>
        {onDelete && (
          <button
            onClick={() => onDelete(character.id)}
            className="flex items-center justify-center px-4 py-2.5 bg-red-500/20 rounded-xl text-red-400 font-medium hover:bg-red-500/30 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
