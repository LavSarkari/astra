import React, { useState } from 'react';

interface FloatingLabelInputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
    label: string;
    isTextArea?: boolean;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({ label, isTextArea = false, className = '', value, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value && value.toString().length > 0;

    const baseClasses = "w-full bg-black/20 border border-white/10 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-white/50 focus:outline-none backdrop-blur-sm transition-all pt-6 pb-2";
    const labelClasses = `absolute left-3 transition-all duration-200 pointer-events-none ${isFocused || hasValue ? 'top-1 text-xs text-brand-cyan' : 'top-3.5 text-sm text-gray-400'
        }`;

    return (
        <div className="relative">
            {isTextArea ? (
                <textarea
                    {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                    className={`${baseClasses} ${className}`}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    value={value}
                />
            ) : (
                <input
                    {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
                    className={`${baseClasses} ${className}`}
                    onFocus={(e) => {
                        setIsFocused(true);
                        props.onFocus?.(e);
                    }}
                    onBlur={(e) => {
                        setIsFocused(false);
                        props.onBlur?.(e);
                    }}
                    value={value}
                />
            )}
            <label className={labelClasses}>
                {label}
            </label>
        </div>
    );
};

export default FloatingLabelInput;
