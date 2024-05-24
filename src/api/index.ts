import type { RequestConfig, HttpOptions } from '@/libs/http'
import HttpRequest from '@/libs/http'
import { getData } from '@/utils'

class ServerHttpRequest extends HttpRequest<any> {
    onRequest(config: RequestConfig, options: HttpOptions) {
        const conf = super.onRequest(config, options)

        if (conf !== undefined) {
            if (!config.url?.endsWith('/login')) {
                const token = getData('jwt-token')
                if (token) {
                    conf.headers = {
                        ...conf.headers,
                        Authorization: `Bearer ${token}`
                    }
                }
            }

            return conf
        }
    }
}

// @ts-ignore
const rootUrl = window['_env_'].VUE_APP_API_URL

export const serverRequest = new ServerHttpRequest({
    host: rootUrl
})
