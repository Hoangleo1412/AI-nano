
import React from 'react';
import { ProductDetails } from '../types';
import CopyToClipboardButton from './CopyToClipboardButton';

interface ProductDetailsDisplayProps {
    details: ProductDetails;
}

const ProductDetailsDisplay: React.FC<ProductDetailsDisplayProps> = ({ details }) => {
    return (
        <div className="max-w-2xl mx-auto mt-12 bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl shadow-2xl border border-gray-800 transition-opacity duration-500 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
            <h3 className="text-2xl font-bold text-white mb-6 text-center">✨ AI Generated Product Details</h3>
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">TITLE</label>
                    <div className="flex items-center gap-2">
                        <p className="w-full bg-gray-800 p-3 rounded-md text-gray-200">{details.title}</p>
                        <CopyToClipboardButton textToCopy={details.title} />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">DESCRIPTION</label>
                    <div className="flex items-start gap-2">
                        <p className="w-full bg-gray-800 p-3 rounded-md text-gray-200 whitespace-pre-wrap">{details.description}</p>
                        <CopyToClipboardButton textToCopy={details.description} />
                    </div>
                </div>
                <div>
                    <label className="text-sm font-semibold text-gray-400 block mb-2">SEO TAGS</label>
                    <div className="flex items-start gap-2">
                        <div className="w-full bg-gray-800 p-3 rounded-md text-gray-200">
                           {details.tags.split(',').map(tag => (
                               <span key={tag} className="inline-block bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-300 mr-2 mb-2">{tag.trim()}</span>
                           ))}
                        </div>
                        <CopyToClipboardButton textToCopy={details.tags} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailsDisplay;
