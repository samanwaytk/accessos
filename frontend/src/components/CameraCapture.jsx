import React, { useRef, useState, useEffect } from 'react';
import { FaCamera } from 'react-icons/fa';

const CameraCapture = ({ onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (stream && videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    const startCamera = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error("Camera API not supported by this browser (requires HTTPS or localhost).");
            }
            let mediaStream;
            try {
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: { facingMode: "environment" } 
                });
            } catch (fallbackErr) {
                // Fallback for desktops/laptops without an 'environment' camera
                mediaStream = await navigator.mediaDevices.getUserMedia({ 
                    video: true 
                });
            }
            setStream(mediaStream);
            setError(null);
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError(err.message || "Camera access is unavailable. You can upload an image instead.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            
            canvasRef.current.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
                    onCapture(file);
                    stopCamera();
                }
            }, 'image/jpeg');
        }
    };

    return (
        <div className="card">
            <h2>Camera</h2>
            {error && <div className="danger-btn" style={{padding: '12px', marginBottom: '12px'}} role="alert">{error}</div>}
            
            {!stream ? (
                <button onClick={startCamera} aria-label="Start Camera">
                    <FaCamera /> Open Camera
                </button>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
                        aria-label="Camera Feed"
                    />
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button onClick={captureImage} aria-label="Take Picture">
                            <FaCamera /> Capture
                        </button>
                        <button onClick={stopCamera} className="danger-btn" aria-label="Cancel Camera">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
};

export default CameraCapture;
