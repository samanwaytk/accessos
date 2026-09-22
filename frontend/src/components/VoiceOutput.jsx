import React, { useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaStop, FaRedo } from 'react-icons/fa';

const VoiceOutput = ({ text, autoPlay = false }) => {
    const synth = window.speechSynthesis;
    const utteranceRef = useRef(null);

    useEffect(() => {
        if (text) {
            utteranceRef.current = new SpeechSynthesisUtterance(text);
            if (autoPlay) {
                play();
            }
        }
        return () => {
            synth.cancel();
        };
    }, [text, autoPlay]);

    const play = () => {
        if (synth.paused) {
            synth.resume();
        } else if (utteranceRef.current) {
            synth.cancel(); // stop current before new
            synth.speak(utteranceRef.current);
        }
    };

    const pause = () => {
        synth.pause();
    };

    const stop = () => {
        synth.cancel();
    };

    const repeat = () => {
        synth.cancel();
        if (utteranceRef.current) {
             synth.speak(utteranceRef.current);
        }
    };

    if (!text) return null;

    return (
        <div className="card" aria-label="Voice Output Controls">
            <h2>Audio Playback</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button onClick={play} aria-label="Play Audio"><FaPlay /> Play</button>
                <button onClick={pause} aria-label="Pause Audio"><FaPause /> Pause</button>
                <button onClick={stop} className="danger-btn" aria-label="Stop Audio"><FaStop /> Stop</button>
                <button onClick={repeat} aria-label="Repeat Audio"><FaRedo /> Repeat</button>
            </div>
        </div>
    );
};

export default VoiceOutput;
