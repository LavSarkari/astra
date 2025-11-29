import React, { useState, useLayoutEffect } from 'react';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    rippleColor?: string;
}

const RippleButton: React.FC<RippleButtonProps> = ({
    children,
    className = '',
    rippleColor = 'rgba(255, 255, 255, 0.3)',
    onClick,
    ...props
}) => {
    const [ripples, setRipples] = useState<{ x: number; y: number; size: number; id: number }[]>([]);

    useLayoutEffect(() => {
        let timeoutIds: NodeJS.Timeout[] = [];
        if (ripples.length > 0) {
            const lastRipple = ripples[ripples.length - 1];
            const timeoutId = setTimeout(() => {
                setRipples((prevRipples) => prevRipples.filter((r) => r.id !== lastRipple.id));
            }, 850); // Match animation duration
            timeoutIds.push(timeoutId);
        }
        return () => {
            timeoutIds.forEach(clearTimeout);
        };
    }, [ripples]);

    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;

        const newRipple = { x, y, size, id: Date.now() };
        setRipples((prevRipples) => [...prevRipples, newRipple]);

        if (onClick) {
            onClick(event);
        }
    };

    return (
        <button
            className={`relative overflow-hidden ${className}`}
            onClick={createRipple}
            {...props}
        >
            <span className="relative z-10">{children}</span>
            {ripples.map((ripple) => (
                <span
                    key={ripple.id}
                    style={{
                        top: ripple.y,
                        left: ripple.x,
                        width: ripple.size,
                        height: ripple.size,
                        backgroundColor: rippleColor,
                    }}
                    className="absolute rounded-full pointer-events-none animate-ripple"
                />
            ))}
        </button>
    );
};

export default RippleButton;
