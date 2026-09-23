import axios from 'axios';

const API_BASE_URL = 'https://accessos-ndv3.onrender.com/api'; // Adjust in production

export const api = {
    analyzeImage: async (imageFile, userQuery = null) => {
        const formData = new FormData();
        formData.append('image', imageFile);
        if (userQuery) {
            formData.append('user_query', userQuery);
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/analyze`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error) {
            console.error("Error analyzing image:", error);
            throw error;
        }
    },

    askFollowup: async (question, contextId) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/ask`, {
                question,
                context_id: contextId
            });
            return response.data;
        } catch (error) {
            console.error("Error asking follow-up:", error);
            throw error;
        }
    }
};
