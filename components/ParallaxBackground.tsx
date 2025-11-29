import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxBackgroundProps {
    children: React.ReactNode;
    speed?: number; // 0 to 1, where 0 is static and 1 moves with scroll (but that's default behavior, so maybe negative for reverse?)
    // Actually, let's define speed as a multiplier. < 1 is slower than scroll, > 1 is faster.
}

const ParallaxBackground: React.FC<ParallaxBackgroundProps> = ({ children, speed = 0.5 }) => {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end start"]
    });

    const y = useTransform(scrollYProgress, [0, 1], ["0%", `${50 * speed}%`]);

    return (
        <div ref={ref} className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div style={{ y }} className="w-full h-full">
                {children}
            </motion.div>
        </div>
    );
};

export default ParallaxBackground;
