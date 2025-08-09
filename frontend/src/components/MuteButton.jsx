// frontend/src/components/MuteButton.jsx

import React from 'react';
import { motion } from 'framer-motion';

const SoundOnIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);

const SoundOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
    </svg>
);


export default function MuteButton({ isMuted, onToggle }) {
    return (
        <motion.button
            onClick={onToggle}
            className="fixed top-4 left-4 z-50 p-2 bg-white/20 text-white rounded-full backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-white"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isMuted ? "Unmute sound" : "Mute sound"}
        >
            <AnimatePresence mode="wait" initial={false}>
                <motion.div
                    key={isMuted ? 'muted' : 'unmuted'}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                >
                    {isMuted ? <SoundOffIcon /> : <SoundOnIcon />}
                </motion.div>
            </AnimatePresence>
        </motion.button>
    );
}

// برای کار کردن AnimatePresence، کامپوننت آیکون‌ها باید motion.div داشته باشند
const MotionSoundOnIcon = motion(SoundOnIcon);
const MotionSoundOffIcon = motion(SoundOffIcon);