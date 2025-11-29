import React from 'react';
import SpotlightCard from '../components/SpotlightCard';
import RippleButton from '../components/RippleButton';
import FloatingLabelInput from '../components/FloatingLabelInput';

const Contact: React.FC = () => {
    return (
        <div className="container mx-auto px-4 min-h-screen flex flex-col justify-center items-center max-w-3xl text-gray-200 pb-20 pt-20">

            <SpotlightCard className="bg-brand-gray/30 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-xl w-full" spotlightColor="rgba(57, 211, 248, 0.15)">
                <form className="space-y-6">
                    <FloatingLabelInput
                        id="name"
                        label="Name"
                        type="text"
                    />

                    <FloatingLabelInput
                        id="email"
                        label="Email"
                        type="email"
                    />

                    <FloatingLabelInput
                        id="message"
                        label="Message"
                        isTextArea
                        rows={5}
                    />

                    <RippleButton
                        type="button"
                        className="w-full py-3 px-6 bg-white text-black font-bold rounded-lg shadow-lg hover:bg-gray-200 hover:scale-[1.02] transition-all"
                        rippleColor="rgba(0, 0, 0, 0.2)"
                    >
                        Send Message
                    </RippleButton>
                </form>

                <div className="mt-8 pt-8 border-t border-white/10 flex justify-center space-x-6">
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Twitter</a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">Discord</a>
                </div>
            </SpotlightCard>
        </div>
    );
};

export default Contact;
