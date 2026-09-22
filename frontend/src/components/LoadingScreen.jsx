import React from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ message = "AccessOS is analyzing..." }) => {
    return (
        <div className="loading-overlay">
            <div className="loading-content card">
                <div className="spinner"></div>
                <h2>Processing</h2>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default LoadingScreen;
