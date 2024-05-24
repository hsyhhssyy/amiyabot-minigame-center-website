import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { NotificationOptions } from 'naive-ui'
import { formatDate } from '@/utils'

type RequestPrototype = 'FormData'
type NotificationType = 'info' | 'error' | 'success' | 'warning'

class RequestControl {
    static requesting = 0

    static loading() {
        this.requesting += 1
    }

    static closeLoading() {
        this.requesting -= 1
    }
}

export interface RequestRes<T, E> {
    data: T
    response?: AxiosResponse<T>
    error?: AxiosError<E>
}

export interface RequestConfig extends AxiosRequestConfig {
    prototype?: RequestPrototype
    complete?: () => void
}

export interface HttpOptions {
    host?: string
}

export class NotifyEvent {
    static events: Array<(args: NotificationOptions) => void> = []

    static registerEvent(func: (args: NotificationOptions) => void) {
        this.events.push(func)
    }

    static notify(message: string, title: string, type?: NotificationType, timeout?: number) {
        for (const func of this.events) {
            func({
                meta: formatDate(new Date()),
                type: type || 'info',
                title: title,
                content: message,
                duration: timeout || 3000
            })
        }
    }
}

export default class HttpRequest<R> {
    public host: string
    private instance: AxiosInstance

    constructor(options?: HttpOptions) {
        this.host = options?.host || ''
        this.instance = axios.create({
            timeout: 200000,
            withCredentials: false
        })
        // @ts-ignore
        this.instance.interceptors.request.use((conf) => this.onRequest(conf, options || {}))
        // @ts-ignore
        this.instance.interceptors.response.use(this.onResponse, this.onResponseError)
    }

    onRequest(config: RequestConfig, options: HttpOptions) {
        const host = options.host

        if (!host) {
            return undefined
        }

        config.baseURL = host
        config.headers = {
            ...(config.headers || {})
        }

        const configData = {
            ...config.data,
            ...config.params
        }
        if (Object.keys(configData).length) {
            if (config.prototype === 'FormData') {
                const data = new FormData()
                for (const key in configData) {
                    data.append(key, configData[key])
                }
                config.data = data
                config.headers['Content-Type'] = 'application/x-www-form-urlencoded'
            } else {
                switch (config.method?.toLowerCase()) {
                    case 'post':
                        config.data = JSON.stringify(config.data)
                        config.headers['Content-Type'] = 'application/json'
                        break
                    case 'get':
                        config.params = configData
                        break
                }
            }
        }

        RequestControl.loading()

        return config
    }

    onResponse(response: AxiosResponse) {
        const data = response.data

        RequestControl.closeLoading()

        switch (data.code) {
            case 200:
                NotifyEvent.notify(data.message, '提示', 'success')
                break
            case 500:
                NotifyEvent.notify(data.message, '操作未成功', 'error')
                break
        }

        return { data, response }
    }

    onResponseError(error: AxiosError) {
        const response = error.response

        let errorMessage: string
        if (response?.status) {
            errorMessage = `${response?.config.url}\nCode: ${response?.status} ${response?.statusText}`
        } else {
            errorMessage = '接口请求失败'
        }

        RequestControl.closeLoading()
        NotifyEvent.notify(errorMessage, error.code || 'Error', 'error', 10000)

        return error
    }

    async request<T = R, E = any>(options: RequestConfig): Promise<RequestRes<T, E>> {
        const res = await this.instance.request(options)

        if (res.constructor === AxiosError) {
            return { data: null as T, error: res }
        }

        return res
    }

    async get<T = R>(options: RequestConfig) {
        const { data } = await this.request<T>({
            ...options,
            method: 'get'
        })
        return data
    }

    async post<T = R>(options: RequestConfig) {
        const { data } = await this.request<T>({
            ...options,
            method: 'post'
        })
        return data
    }
}
