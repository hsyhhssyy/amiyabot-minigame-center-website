import { ElMessage } from 'element-plus';

export const toast = async (error: any, defaultMessage: string) => {
    try {
        // 初始化一个默认的错误消息
        let message = defaultMessage;

        // 检查error对象是否有符合预期结构的属性
        // error.response.data可能是数组，如果是数组，需要显示多个toast
        if (error.response &&
            error.response.data &&
            Array.isArray(error.response.data) &&
            error.response.data[0] &&
            error.response.data[0].description) {
            for (const item of error.response.data) {
                message += '\n' + item.description;
            }
        }

        if (error.response &&
            error.response.data &&
            error.response.data.message) {
            message += '\n' + error.response.data.message;
        }

        // 显示红色的toast
        ElMessage({
            message: message,
            type: 'error',
        });
    } catch (e) {
        // do nothing
    }
}