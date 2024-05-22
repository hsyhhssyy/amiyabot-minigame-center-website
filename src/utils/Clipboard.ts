import { ElMessage } from "element-plus";

import { getShortenUrl } from "@src/api/Game";

export const copyInviteLinkToClipboard = async (roomId:string) => {
   var sUrl = await getShortenUrl(roomId);
    const url = "快来和大家一起玩游戏吧，点击链接: "+ sUrl+ " 立刻加入房间。";
    navigator.clipboard.writeText(url).then(() => {
      ElMessage({
        message: '已复制加入链接到剪贴板',
        type: 'success'
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }