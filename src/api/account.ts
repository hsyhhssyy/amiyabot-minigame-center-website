import { serverRequest } from '@/api/index'
import { setData } from '@/utils'

interface UserToken {
    email: string
    token: string
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
        const userRole = user.roles ? user.roles[0] : null
        if (userRole) {
            setData('user-role', userRole)
        }
        const email = user.email ? user.email : ''
        if(user.id) {            
            setData('email', email)
        }
        const userId = user.id
        if (userId) {
            setData('user-id', userId)
        }

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