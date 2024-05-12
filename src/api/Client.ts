import axios from 'axios';

export const createClientApi = async (friendlyName: string, description:string, iconBase64: string,redirectUri:string) => {
    try {
        const response = await axios.post('/api/account/create-client', {
            FriendlyName: friendlyName,
            Description:description,
            IconBase64: iconBase64,
            RedirectUri:redirectUri,
        }, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('An error occurred while creating a client: ', error);
    }
};

export const listClients = async () => {
    try {
        const response = await axios.get('/api/account/list-clients', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error('An error occurred while listing clients: ', error);
    }
};

export const getClient = async (clientId: string) => {
    try {
        const response = await axios.get(`/api/account/get-client/${clientId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('jwt-token')}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error(`An error occurred while fetching client ${clientId}: `, error);
    }
};