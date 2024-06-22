import { serverRequest } from '@/api/index'
import { setData } from '@/utils'

interface UserToken {
    email: string
    token: string
    message: string
}

export interface UserInfo {
    id: string
    email: string
    nickname: string
    avatar: string
    avatarType: string
    roles: string[]
}

export async function quickRegisterApi(nickname: string) {
    return await serverRequest.post<UserToken>({
        url: '/api/account/quickRegister',
        data: {
            Nickname: nickname
        }
    })
}

export async function describeApi() {
    return await serverRequest.get<UserInfo>({
        url: '/api/account/describe'
    })
}

export async function verifyTokenApi(token: string) {
    setData('jwt-token', token)

    const user = await describeApi()
    if (user) {
        return true
    }
    return false
}

export async function loginApi(email: string, password: string) {
    return await serverRequest.post<UserToken>({
        url: '/api/account/login',
        data: {
            email: email,
            password: password
        }
    })
}

export async function registerApi(email: string, password: string, nickname: string) {
    return await serverRequest.post<UserToken>({
        url: '/api/account/register',
        data: {
            email: email,
            password: password,
            nickname: nickname
        }
    })
}


export const changeUserInfoApi = async (nickname: string, avatar: string, avatarType: string) => {
    return await serverRequest.post<UserToken>({
        url: '/api/account/change-user-info',
        data: {
            nickname: nickname,
            avatar: avatar,
            avatarType: avatarType
        }
    })
}

export const changePasswordApi = async (oldPassword:string, newPassword:string) => {
    return await serverRequest.post<UserToken>({
        url: '/api/account/change-password',
        data: {
            currentPassword: oldPassword,
            newPassword: newPassword,
        }
    })
}