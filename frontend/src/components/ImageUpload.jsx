import React from 'react';
import { FaUpload } from 'react-icons/fa';

const ImageUpload = ({ onUpload }) => {
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            onUpload(file);
        }
    };

    return (
        <div className="card">
            <h2>Upload Image</h2>
            <label htmlFor="file-upload" className="file-upload-label" aria-label="Upload an image from your device">
                <FaUpload /> Choose File
                <input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleFileChange}
                    className="visually-hidden" 
                />
            </label>
        </div>
    );
};

export default ImageUpload;
