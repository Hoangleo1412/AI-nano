
import React from 'react';
import { Mockup } from '../types';
import Button from './Button';
import { IconDownload } from '../constants';

interface MockupCardProps {
    mockup: Mockup;
    onDownload: (imageUrl: string, name: string) => void;
    onRegenerate?: () => void;
}

const SkeletonLoader = ({ className }: { className: string }) => <div className={`animate-pulse bg-gray-800 ${className}`}></div>;

const LoadingCard: React.FC<{ name: string }> = ({ name }) => (
    <div className="relative pb-4 bg-gray-900 rounded-xl shadow-md">
        <SkeletonLoader className="aspect-[4/3] rounded-t-xl" />
        <div className="mt-3 flex justify-center px-2">
            <SkeletonLoader className="h-5 w-1/2 rounded-md" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-yellow-400"></div>
        </div>
    </div>
);

const ErrorCard: React.FC<{ name: string, onRegenerate?: () => void }> = ({ name, onRegenerate }) => (
    <div className="relative group pb-4 bg-gray-900 rounded-xl shadow-md">
        <div className="rounded-t-xl bg-gray-800 border-2 border-dashed border-red-500/50 aspect-[4/3] flex flex-col items-center justify-center text-center p-4">
            <p className="text-red-400 font-medium mb-4">Mockup creation failed</p>
            {onRegenerate && <Button onClick={onRegenerate} primary>Retry</Button>}
        </div>
        <p className="text-center mt-3 text-lg font-semibold text-gray-300 px-3">{name}</p>
    </div>
);

const SuccessCard: React.FC<{ name: string, imageUrl: string, onDownload: (imageUrl: string, name: string) => void }> = ({ name, imageUrl, onDownload }) => (
     <div className="relative group pb-4 bg-gray-900 rounded-xl shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
        <div className="rounded-t-xl overflow-hidden aspect-[4/3] bg-black p-2">
            <img src={imageUrl} alt={`Mockup of ${name}`} className="w-full h-full object-contain" />
        </div>
        <p className="text-center mt-3 text-lg font-semibold text-gray-300 px-3">{name}</p>
        <button
            onClick={() => onDownload(imageUrl, name)}
            className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all backdrop-blur-sm shadow-lg opacity-0 group-hover:opacity-100"
            aria-label="Download mockup"
        >
            <IconDownload />
        </button>
    </div>
);


const MockupCard: React.FC<MockupCardProps> = ({ mockup, onDownload, onRegenerate }) => {
    switch (mockup.status) {
        case 'success':
            return <SuccessCard name={mockup.name} imageUrl={mockup.imageUrl!} onDownload={onDownload} />;
        case 'failed':
            return <ErrorCard name={mockup.name} onRegenerate={onRegenerate} />;
        case 'pending':
        default:
            return <LoadingCard name={mockup.name} />;
    }
};

export default MockupCard;
