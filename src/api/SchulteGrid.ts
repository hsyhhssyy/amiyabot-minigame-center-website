import axios from 'axios';

var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
rootUrl = "http://localhost:5003"

export const getGame = async (gameId:string) => {
    try {
        const response = await axios.get(rootUrl + '/api/schulteGridGame/'+gameId, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};