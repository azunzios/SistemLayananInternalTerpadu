    import React from 'react';
import { motion } from 'motion/react';

// Emoji wajah saja
const faceEmojis = ['😊', '😄', '😁', '🥰', '😍', '🤩', '😇', '🙂', '😃', '😆', '😅', '🤗', '😌', '😉', '😋'];

export const AboutUsPage: React.FC = () => {
  // Generate posisi emoji dari kiri ke kanan secara teratur
  const emojiRain = [...Array(30)].map((_, i) => {
    const column = i % 15; // 15 kolom
    const xPosition = (column / 14) * 100; // Tersebar dari 0% sampai 100%
    
    return {
      emoji: faceEmojis[i % faceEmojis.length],
      xPosition,
      delay: (i % 15) * 0.3, // Delay berdasarkan kolom
      duration: 8 + (i % 5), // Durasi bervariasi 8-12 detik
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 relative overflow-hidden flex items-center justify-center">
      {/* Emoji rain effect - teratur seperti hujan dari kiri ke kanan */}
      {emojiRain.map((item, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl"
          style={{
            left: `${item.xPosition}%`,
            top: 0,
          }}
          initial={{
            y: -100,
            rotate: 0,
            opacity: 0,
          }}
          animate={{
            y: '100vh',
            rotate: [0, 10, -10, 0],
            opacity: [0, 0.7, 1, 0.7, 0],
          }}
          transition={{
            duration: item.duration,
            repeat: Infinity,
            delay: item.delay,
            ease: "linear",
          }}
        >
          {item.emoji}
        </motion.div>
      ))}

      {/* Content - Hanya Teks Tengah */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="relative z-10 text-center px-4"
      >
        <motion.h1
          className="text-7xl md:text-9xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 bg-clip-text text-transparent"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          TIM 2
        </motion.h1>
        <motion.h2
          className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 bg-clip-text text-transparent mt-4"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        >
          RPL 3SI2
        </motion.h2>
      </motion.div>
    </div>
  );
};
