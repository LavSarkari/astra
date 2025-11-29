import React from 'react';

const Header: React.FC = () => {
    return (
        <header className="text-center relative z-10">
            <h1 className="text-4xl sm:text-5xl font-bold text-brand-cyan tracking-wider drop-shadow-[0_0_15px_rgba(57,211,248,0.5)]">ASTRA</h1>
            <p className="mt-2 text-lg text-gray-400 font-light tracking-wide">AI-Driven Semantic Threat Reconnaissance Agent</p>
        </header>
    );
};

export default Header;