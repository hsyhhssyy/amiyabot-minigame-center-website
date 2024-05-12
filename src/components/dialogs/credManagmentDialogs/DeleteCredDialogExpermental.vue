<template>
    <div>
        <div class="dialog">
            <div>
                <h3>确认删除</h3>
                <p>你确定要删除以下凭据吗？</p>
                <div>角色名称: {{ credName }}</div>
                <div>凭据: {{ credValue }}</div>
            </div>
                <button @click="cancel">取消</button>
                <button @click="confirm">确认删除</button>
        </div>
    </div>
</template>

<script lang="ts">
import {ref, toRefs,createApp,h } from 'vue';
import DeleteCredDialog from './DeleteCredDialogExpermental.vue'

export const ShowDialog = (message:any) => {
  return new Promise((resolve, reject) => {
    const div = document.createElement('div')
    document.body.appendChild(div)

    const dialogApp = createApp({
      render() {
        return h(DeleteCredDialog, {
          message,
          resolve: () => {
            resolve(true)
            dialogApp.unmount()
            document.body.removeChild(div)
          },
          reject: () => {
            reject()
            dialogApp.unmount()
            document.body.removeChild(div)
          },
        })
      },
    })

    dialogApp.mount(div)
  })
}

</script>

<script setup lang="ts">

const props = defineProps<{
    message: String;
    resolve: Function;
    reject: Function;
}>();

const { message, resolve, reject } = toRefs(props)

const localShowDialog = ref(false);

const credName = ref(message)
const credValue = ref("456")

const cancel = () => {
    localShowDialog.value = false;
    reject.value()
};

const confirm = () => {
    localShowDialog.value = false;
    resolve.value()
};

</script>

<style></style>