import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import { FaMicrophone, FaStop } from 'react-icons/fa';

const VoiceInput = ({ onCommand }) => {
    const {
        transcript,
        listening,
        resetTranscript,
        browserSupportsSpeechRecognition
    } = useSpeechRecognition();

    if (!browserSupportsSpeechRecognition) {
        return <div className="card" role="alert">Browser doesn't support speech recognition.</div>;
    }

    const handleStart = () => {
        resetTranscript();
        SpeechRecognition.startListening({ continuous: true });
    };

    const handleStop = () => {
        SpeechRecognition.stopListening();
        if (transcript) {
            onCommand(transcript);
            resetTranscript();
        }
    };

    return (
        <div className="card" aria-label="Voice Input Controls">
            <h2>Voice Command</h2>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                {!listening ? (
                    <button 
                        onClick={handleStart} 
                        aria-label="Start Listening"
                    >
                        <FaMicrophone /> Ask AccessOS
                    </button>
                ) : (
                    <button 
                        onClick={handleStop} 
                        className="danger-btn"
                        aria-label="Stop Listening and Submit"
                    >
                        <FaStop /> Stop & Submit
                    </button>
                )}
            </div>
            {listening && <p aria-live="polite">Listening: {transcript}</p>}
        </div>
    );
};

export default VoiceInput;
