import axios from 'axios';

//var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
var rootUrl = window._env_.VUE_APP_API_URL;

export const getCharacterTable = async () => {
    try {
        const response = await axios.get(rootUrl + '/api/characterMap', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};

export const getCharacterIds = async () => {
    try {
        const response = await axios.get(rootUrl + '/api/characterMap/operator-ids', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};

export const jmesPathQuery = async (file: string, query: string) => {
    try {
        const response = await axios.post(rootUrl + '/api/arknights/jmes-path',
            {
                File: file,
                Query: query
            }
            , {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
                },
            });
        return response.data;
    } catch (error: any) {
        return null;
    }
};
