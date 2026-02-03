import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Sparkles, Users, MessageCircle } from 'lucide-react';
import { useCharacterStore } from '@/stores/characterStore';
import CharacterCard from '@/components/character/CharacterCard';

export default function Home() {
  const { characters, fetchCharacters, loading } = useCharacterStore();

  useEffect(() => {
    fetchCharacters();
  }, [fetchCharacters]);

  const features = [
    {
      icon: Sparkles,
      title: '个性化定制',
      desc: '自由设置外貌、性格、爱好，打造专属理想型',
    },
    {
      icon: MessageCircle,
      title: '智能对话',
      desc: '基于AI大模型，理解你的每一次倾诉',
    },
    {
      icon: Heart,
      title: '情感陪伴',
      desc: '记住你们的回忆，持续加深羁绊',
    },
    {
      icon: Users,
      title: '多角色支持',
      desc: '创建多个不同类型的AI伴侣',
    },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden">
        {/* 背景装饰 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-500/20 rounded-full text-primary-400 text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>让心灵共鸣成为可能</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white via-pink-200 to-primary-300 bg-clip-text text-transparent">
                SoulEcho
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              你的AI灵魂伴侣在这里。定制理想型，开启一段温暖的心灵对话，
              让每一次交流都充满意义。
            </p>

            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                to="/create"
                className="px-8 py-4 bg-gradient-to-r from-primary-500 to-pink-500 rounded-full text-white font-medium hover:shadow-xl hover:shadow-primary-500/30 transition-all hover:scale-105"
              >
                开始创建
              </Link>
              <a
                href="#characters"
                className="px-8 py-4 bg-white/10 backdrop-blur rounded-full text-white font-medium hover:bg-white/20 transition-all"
              >
                查看角色
              </a>
            </div>
          </motion.div>
        </div>

        {/* 滚动提示 */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </section>

      {/* 特性介绍 */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-6 hover:bg-white/15 transition-all group"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500/20 to-pink-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 角色展示 */}
      <section id="characters" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-white">我的伴侣</h2>
            <Link
              to="/create"
              className="flex items-center gap-2 text-primary-400 hover:text-primary-300 transition-colors"
            >
              <span>创建新角色</span>
              <span className="text-lg">→</span>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : characters.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">还没有创建角色</h3>
              <p className="text-gray-400 mb-6">点击下方按钮，创建你的第一位AI伴侣</p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 rounded-full text-white font-medium hover:bg-primary-600 transition-colors"
              >
                + 创建角色
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map((character, index) => (
                <motion.div
                  key={character.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <CharacterCard character={character} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
