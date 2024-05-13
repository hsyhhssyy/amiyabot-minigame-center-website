import axios from 'axios';

interface LoginResult {
    success: boolean;
    error?: string; // 错误信息是可选的，因为如果登录成功，将没有错误信息。
}

var rootUrl = import.meta.env.VITE_BACKEND_BASE_URL

export const loginAPI = async (email: string, password: string): Promise<LoginResult> => {
    try {
        const response = await axios.post(rootUrl + '/api/account/login', {
            email,
            password,
        });

        if (response.data.token) {
            return quickLoginAPI(response.data.token,email);
        }
        return { success: false, error: "登录失败" };
    } catch (error: any) {
        return { success: false, error: error.message || "未知错误" };
    }
};

export const quickLoginAPI = async (token: string,email:string): Promise<LoginResult> => {
    try {
        if (token) {
            localStorage.setItem('jwt-token', token);
            localStorage.setItem('email', email);

            const user = await describeAPI();
            if (user) {
                const userRole = user.roles ? user.roles[0] : null;
                if (userRole){
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
        return { success: false, error: "登录失败" };
    } catch (error: any) {
        return { success: false, error: error.message || "未知错误" };
    }
}

export const describeAPI = async () => {
    try {
        const response = await axios.get(rootUrl + '/api/account/describe');
        return response.data; //.roles ? response.data.roles[0] : null;
    } catch (error: any) {
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