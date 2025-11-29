import React from 'react';
import BlurReveal from '../components/BlurReveal';

const About: React.FC = () => {
    return (
        <div className="container mx-auto px-4 min-h-screen flex flex-col justify-center items-center max-w-4xl pt-20">


            <div className="space-y-16">
                <BlurReveal delay={1}>
                    <section className="bg-brand-gray/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-brand-cyan/30 transition-colors duration-300 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">🎯</span>
                            Our Mission
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            ASTRA is designed to democratize web security testing. We believe that every developer,
                            from students to enterprise engineers, should have access to powerful, automated security
                            analysis tools. Our goal is to make the web safer by identifying vulnerabilities before
                            they can be exploited.
                        </p>
                    </section>
                </BlurReveal>

                <BlurReveal delay={2}>
                    <section className="bg-brand-gray/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 hover:border-brand-cyan/30 transition-colors duration-300 max-w-2xl mx-auto">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-lg bg-brand-cyan/20 flex items-center justify-center text-brand-cyan">🔒</span>
                            Privacy First
                        </h2>
                        <p className="text-gray-300 leading-relaxed">
                            We respect your privacy and the security of the targets you scan. ASTRA operates
                            passively, analyzing only publicly available information and server responses
                            without attempting invasive exploitation.
                        </p>
                    </section>
                </BlurReveal>
            </div>
        </div>
    );
};

export default About;
