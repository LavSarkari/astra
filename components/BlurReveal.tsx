import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

interface BlurRevealProps {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    blurAmount?: number;
    yOffset?: number;
    scaleAmount?: number;
}

const BlurReveal: React.FC<BlurRevealProps> = ({
    children,
    className = '',
    delay = 0,
    blurAmount = 10,
    yOffset = 20,
    scaleAmount = 0.95
}) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: false, margin: "-10% 0px -10% 0px" });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{
                opacity: 0,
                filter: `blur(${blurAmount}px)`,
                y: yOffset,
                scale: scaleAmount
            }}
            animate={isInView ? {
                opacity: 1,
                filter: "blur(0px)",
                y: 0,
                scale: 1
            } : {
                opacity: 0,
                filter: `blur(${blurAmount}px)`,
                y: yOffset,
                scale: scaleAmount
            }}
            transition={{
                duration: 0.8,
                ease: [0.25, 0.4, 0.25, 1], // Smooth cubic bezier
                delay: delay * 0.1
            }}
        >
            {children}
        </motion.div>
    );
};

export default BlurReveal;
