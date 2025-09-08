
import React from 'react';

interface ErrorNotificationProps {
    message: string | null;
    onDismiss: () => void;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({ message, onDismiss }) => {
    if (!message) return null;
    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md p-4 bg-red-900 border border-red-700 text-white rounded-lg shadow-2xl flex items-center justify-between transition-all duration-300 animate-fade-in-down">
            <span>{message}</span>
            <button onClick={onDismiss} className="p-1 rounded-full hover:bg-red-800 transition-colors ml-4 text-2xl leading-none">&times;</button>
        </div>
    );
};

export default ErrorNotification;
