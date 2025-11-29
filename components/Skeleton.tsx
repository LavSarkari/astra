import React from 'react';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`animate-pulse bg-brand-gray/50 rounded ${className}`}></div>
    );
};

export const CardSkeleton: React.FC = () => {
    return (
        <div className="bg-brand-gray/30 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-4">
            <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 w-3/4">
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex justify-between">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
        </div>
    );
};

export default Skeleton;
