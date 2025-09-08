
import React, { useState } from 'react';
import { IconCopy } from '../constants';

interface CopyToClipboardButtonProps {
    textToCopy: string;
}

const CopyToClipboardButton: React.FC<CopyToClipboardButtonProps> = ({ textToCopy }) => {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(textToCopy).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <button onClick={handleCopy} className={`p-2 rounded-md transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`} title="Copy to clipboard">
            {copied ? 'Copied!' : <IconCopy />}
        </button>
    );
};

export default CopyToClipboardButton;
