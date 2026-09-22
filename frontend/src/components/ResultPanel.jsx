import React from 'react';

const ResultPanel = ({ result }) => {
    if (!result) return null;

    return (
        <div className="card" aria-live="polite" aria-atomic="true">
            <h2>Analysis Result</h2>
            <div style={{ marginBottom: '16px' }}>
                <strong>Context:</strong> {result.context}
            </div>
            <div style={{ marginBottom: '16px' }}>
                <strong>Response:</strong>
                <p style={{ fontSize: '1.4rem', marginTop: '8px' }}>
                    {result.response || result.answer}
                </p>
            </div>
            
            {result.important_information && result.important_information.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                    <strong>Important Information:</strong>
                    <ul style={{ paddingLeft: '24px', marginTop: '8px' }}>
                        {result.important_information.map((info, idx) => (
                            <li key={idx}>{info}</li>
                        ))}
                    </ul>
                </div>
            )}
            
            {result.needs_retry && (
                <div style={{ color: 'var(--danger-color)', fontWeight: 'bold', marginTop: '16px' }}>
                    The image was unclear. Please try capturing it again.
                </div>
            )}
        </div>
    );
};

export default ResultPanel;
