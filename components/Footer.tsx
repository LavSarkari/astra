import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 py-4 text-center pointer-events-none">
            <div className="container mx-auto px-4">
                <p className="text-sm text-gray-500 font-medium">
                    Built with <span className="text-brand-red">❤️</span> by the ASTRA Team.
                </p>
                <p className="text-[10px] text-gray-600 mt-1">
                    © 2025 ASTRA Security.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
