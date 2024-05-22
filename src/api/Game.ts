import axios from 'axios';

//var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
var rootUrl = window._env_.VUE_APP_API_URL;

export const getGame = async (gameId:string) => {
    try {
        const response = await axios.get(rootUrl + '/api/gameHub/'+gameId, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};

export const listGame = async () => {
    try {
        const response = await axios.get(rootUrl + '/api/gameHub/', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};