type NotificationType = 'default' | 'error' | 'info' | 'success' | 'warning'

export function deepCopy<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

export function setData(name: string, data: any) {
    let dataStr = null
    if (typeof data === 'object') {
        dataStr = JSON.stringify(data)
    }
    if (typeof data === 'string' || typeof data === 'number') {
        dataStr = data.toString()
    }
    if (dataStr) {
        localStorage.setItem('amiya-' + name, dataStr)
    }
}

export function getData<T>(name: string, parse?: (value: string) => T): T | string | undefined {
    const data = localStorage.getItem('amiya-' + name) || ''
    if (data) {
        if (parse) {
            try {
                return parse(data)
            } catch (e) {
                /* empty */
            }
        }
        return data
    }
}

export function removeData(name: string) {
    localStorage.removeItem('amiya-' + name)
}

export function correctDate(value: Date | number | string, onInvalid?: () => Date): Date {
    if (value.constructor === Date) {
        return value
    }
    if (value.constructor === Number && value.toString().length < 13) {
        value = value * 1000
    }
    const result = new Date(value)

    if (result.toString() === 'Invalid Date') {
        if (onInvalid) {
            return onInvalid()
        }
        return new Date()
    }

    return result
}

export function formatDate(value: Date | number | string, format = 'y-m-d h:i:s') {
    const date = correctDate(value)

    const zero = (num: number) => (parseInt(String(num)) < 10 ? '0' + num : num).toString()
    const contrast: { [key: string]: string } = {
        y: date.getFullYear().toString(),
        m: zero(date.getMonth() + 1),
        d: zero(date.getDate()),
        h: zero(date.getHours()),
        i: zero(date.getMinutes()),
        s: zero(date.getSeconds())
    }

    for (const n in contrast) {
        format = format.replace(new RegExp(n, 'g'), contrast[n])
    }

    return format
}

export async function sleep(ms: number) {
    return new Promise((resolve) => {
        setTimeout(() => resolve(undefined), ms)
    })
}

export async function toast(content: string, type: NotificationType = 'default') {
    if ('notification' in window) {
        // @ts-ignore
        window.notification.create({
            type: type,
            content: content
        })
    }
}
