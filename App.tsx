import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Squares from './components/Squares';

import Footer from './components/Footer';

const App: React.FC = () => {
    return (
        <Router>
            <div className="min-h-screen bg-brand-dark text-gray-300 font-sans relative pb-20">
                {/* Global Background for other pages - Home handles its own conditional background */}
                <Routes>
                    <Route path="/" element={<>{/* Home has its own background logic */}</>} />
                    <Route path="*" element={
                        <div className="absolute inset-0 z-0">
                            <Squares
                                speed={0.5}
                                squareSize={40}
                                direction='diagonal'
                                borderColor='#333'
                                hoverFillColor='#222'
                            />
                        </div>
                    } />
                </Routes>

                <NavBar />

                <div className="relative z-10">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />

                    </Routes>
                </div>

                <Footer />
            </div>
        </Router>
    );
};

export default App;