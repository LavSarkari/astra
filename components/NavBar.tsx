import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavBar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' : 'text-gray-500 hover:text-gray-300';
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
            <div className="relative group/nav">
                {/* Ambient Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-brand-cyan/10 to-transparent blur-xl opacity-0 group-hover/nav:opacity-100 transition-opacity duration-500 rounded-full pointer-events-none" />

                {/* Main Container */}
                <div className="relative bg-black/20 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 shadow-2xl flex items-center justify-between min-w-[320px] sm:min-w-[500px] gap-8 transition-all duration-300 hover:bg-black/30 hover:border-white/20 hover:shadow-brand-cyan/5">
                    {/* Logo Section - Trishul Icon */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="relative flex items-center justify-center w-8 h-8">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-8 h-8 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)] group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.8)] transition-all duration-300">
                                {/* Center Shaft */}
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v18" />
                                {/* Side Prongs (Trident shape) */}
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8v3c0 3.31 2.69 6 6 6s6-2.69 6-6V8" />
                                {/* Tips */}
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 8l-2 2 M18 8l2 2 M12 3l-2 2 M12 3l2 2" />
                            </svg>
                        </div>
                        <div className="text-xl font-bold text-white tracking-wider drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all">
                            ASTRA
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <div className="flex items-center space-x-6 sm:space-x-8">
                        <Link to="/" className={`text-sm font-medium transition-all duration-300 relative ${isActive('/')}`}>
                            Home
                            {location.pathname === '/' && (
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)] rounded-full" />
                            )}
                        </Link>
                        <Link to="/about" className={`text-sm font-medium transition-all duration-300 relative ${isActive('/about')}`}>
                            About
                            {location.pathname === '/about' && (
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)] rounded-full" />
                            )}
                        </Link>

                        <Link to="/contact" className={`text-sm font-medium transition-all duration-300 relative ${isActive('/contact')}`}>
                            Contact
                            {location.pathname === '/contact' && (
                                <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-cyan shadow-[0_0_8px_rgba(34,211,238,0.8)] rounded-full" />
                            )}
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;
