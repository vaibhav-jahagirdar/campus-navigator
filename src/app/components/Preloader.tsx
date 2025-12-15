'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const words = ['Campus', 'Navigator'];

export default function Preloader({ onComplete }: { onComplete: () => void }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const totalDuration = 1800 + 60;
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onComplete, 1200);
    }, totalDuration);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          initial={{ x: 0 }}
          animate={{ x: 0 }}
          exit={{ y: '-100%' }} // vertical slide
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <div
            className="flex gap-6 font-semibold font-sfpro tracking-[-0.06em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl flex-wrap justify-center text-center px-4"
            
          >
            {words.map((word, wordIndex) => (
              <div key={wordIndex} className="flex items-center">
                {word.split('').map((char, charIndex) => (
                  <motion.span
                    key={`${wordIndex}-${charIndex}`}
                    className="inline-block min-w-[0.3em] text-white"
                    initial={{ y: '100vh', opacity: 0.2, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      delay:
                        wordIndex * word.length * 0.1 + charIndex * 0.06,
                      duration: 0.4,
                      ease: 'easeOut',
                    }}
                  >
                    {char}
                  </motion.span>
                ))}

                {word === 'Navigator' && (
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-[1.1em] w-[1.1em] text-white inline-block "
                    initial={{ y: '100vh', opacity: 0.2, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{
                      delay:
                        wordIndex * word.length * 0.1 + word.length * 0.06,
                      duration: 0.4,
                      ease: 'easeOut',
                    }}
                  >
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
                  </motion.svg>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
