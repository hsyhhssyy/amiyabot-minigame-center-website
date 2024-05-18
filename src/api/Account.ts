import axios from 'axios';
import { toast } from '@src/utils/Toast.ts';

//var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL
var rootUrl = window._env_.VUE_APP_API_URL;

export const loginAPI = async (email: string, password: string) => {
    try {
        const response = await axios.post(rootUrl + '/api/account/login', {
            email,
            password,
        });

        if (response.data.token) {
            return quickLoginAPI(response.data.token, email);
        }
        return false;
    } catch (error: any) {
        toast(error, "登录失败")
        return false;
    }
};

export const quickLoginAPI = async (token: string, email: string) => {
    try {
        if (token) {
            localStorage.setItem('jwt-token', token);
            localStorage.setItem('email', email);

            const user = await describeAPI();
            if (user) {
                const userRole = user.roles ? user.roles[0] : null;
                if (userRole) {
                    localStorage.setItem('user-role', userRole);
                }
                const nickname = user.nickname;
                if (nickname) {
                    localStorage.setItem('nickname', nickname);
                }
                const userId = user.id;
                if (userId) {
                    localStorage.setItem('user-id', userId);
                }
            }

            return { success: true };
        }
        return false
    } catch (error: any) {
        toast(error, "登录失败")
        return false
    }
}

export const registerAPI = async (email: string, password: string, nickname: string, claimedRole: string) => {
    try {
        const registerModel = {
            Email: email,
            Password: password,
            Nickname: nickname,
            ClaimedRole: claimedRole,
        };

        const response = await axios.post(rootUrl +'/api/account/register', registerModel);
        return response.data;
    } catch (error: any) {

        toast(error, "注册失败")
        
        return null;
    }
}

export const quickRegisterAPI = async (nickname: string) => {
    try {
        const response = await axios.post(rootUrl +'/api/account/quickRegister', {
            Nickname: nickname
        });
        return response.data;
    } catch (error: any) {
        toast(error, "快速注册失败")
        return null;
    }

}

export const describeAPI = async () => {
    try {
        const response = await axios.get(rootUrl + '/api/account/describe');
        return response.data; //.roles ? response.data.roles[0] : null;
    } catch (error: any) {
        toast(error, "获取用户信息失败")
        return null;
    }
};

// 检查用户是否已登录
export const isLoggedIn = (): boolean => {
    const token = localStorage.getItem('jwt-token');
    const role = localStorage.getItem('user-role');
    return (!!token) && (!!role); // 双重否定将 null 或 undefined 转换为 false，有效值转换为 true
};

export const LogoutApi = () => {
    localStorage.removeItem('jwt-token');
    localStorage.removeItem('user-role');
};

export const getRole = (): string | null => {
    const role = localStorage.getItem('user-role');
    return role;
}


export const authorizeApi = async (clientId: string, redirectUri: string, state: string) => {
    try {
        const encodedRedirectUri = encodeURIComponent(redirectUri);
        const response = await axios.get(`${rootUrl}/connect/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=TestReadData&state=${state}`);
        return response
    } catch (error: any) {
        return null;
    }
};

export const changeUserInfoApi = async (nickname: string, avatar: string, avatarType: string) => {
    try {
        const response = await axios.post(`${rootUrl}/api/account/change-user-info`, {
            Nickname: nickname,
            Avatar: avatar,
            AvatarType: avatarType
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
}