import React, { useState } from 'react';
import CameraCapture from '../components/CameraCapture';
import ImageUpload from '../components/ImageUpload';
import VoiceInput from '../components/VoiceInput';
import VoiceOutput from '../components/VoiceOutput';
import ResultPanel from '../components/ResultPanel';
import LoadingScreen from '../components/LoadingScreen';
import { api } from '../services/api';

const Dashboard = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [currentImage, setCurrentImage] = useState(null);

    const handleAnalyze = async (file, query = null) => {
        setLoading(true);
        setError(null);
        setCurrentImage(file);
        
        try {
            const data = await api.analyzeImage(file, query);
            setResult(data);
        } catch (err) {
            setError("Failed to analyze the image. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleVoiceCommand = async (transcript) => {
        if (!transcript) return;
        
        setLoading(true);
        setError(null);

        try {
            if (result && result.context_id) {
                // If we already have a context, this is a follow-up question
                const data = await api.askFollowup(transcript, result.context_id);
                // Merge the new answer into the result structure for display/tts
                setResult({
                    ...result,
                    response: data.answer
                });
            } else if (currentImage) {
                // If we have an image but no context, treat as initial analysis with query
                await handleAnalyze(currentImage, transcript);
            } else {
                setError("Please capture or upload an image first before asking questions.");
            }
        } catch (err) {
            setError("Failed to process your question.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <header style={{ marginBottom: '40px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '3rem', borderBottom: '2px solid var(--glass-border)', paddingBottom: '20px', display: 'inline-block' }}>
                    AccessOS
                </h1>
                <p style={{ fontSize: '1.2rem', marginTop: '12px', color: 'var(--text-secondary)' }}>
                    Your AI visual accessibility assistant.
                </p>
            </header>

            <main>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <CameraCapture onCapture={(file) => handleAnalyze(file)} />
                    <ImageUpload onUpload={(file) => handleAnalyze(file)} />
                </div>

                <VoiceInput onCommand={handleVoiceCommand} />

                {loading && (
                    <LoadingScreen />
                )}

                {error && (
                    <div className="card" role="alert" style={{ borderLeft: '4px solid var(--danger-color)' }}>
                        <h2 style={{ color: 'var(--danger-color)' }}>Error</h2>
                        <p>{error}</p>
                    </div>
                )}

                {result && !loading && (
                    <>
                        <ResultPanel result={result} />
                        <VoiceOutput text={result.response || result.answer} autoPlay={true} />
                    </>
                )}
            </main>
        </div>
    );
};

export default Dashboard;
