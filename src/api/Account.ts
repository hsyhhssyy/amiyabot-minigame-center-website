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

export async function quickRegisterAPI(nickname: string) {
    return await serverRequest.post<UserToken>({
        url: '/api/account/quickRegister',
        data: {
            Nickname: nickname
        }
    })
}

export async function describeAPI() {
    return await serverRequest.get<UserInfo>({
        url: '/api/account/describe'
    })
}

export async function quickLoginAPI(token: string, email: string) {
    setData('jwt-token', token)
    setData('email', email)

    const user = await describeAPI()
    if (user) {
        const userRole = user.roles ? user.roles[0] : null
        if (userRole) {
            setData('user-role', userRole)
        }

        const userId = user.id
        if (userId) {
            setData('user-id', userId)
        }

        return true
    }
    return false
}
