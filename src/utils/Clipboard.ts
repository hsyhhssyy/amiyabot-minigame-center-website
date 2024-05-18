import { ElMessage } from "element-plus";

export const copyInviteLinkToClipboard = (roomId:string,joinCode:string) => {
    const url = "快来和大家一起玩游戏吧，点击链接: https://game.anonymous-test.top/#/regular-home/room-waiting/" + roomId + "?joinCode=" + joinCode + " 立刻加入房间。";
    navigator.clipboard.writeText(url).then(() => {
      ElMessage({
        message: '已复制加入链接到剪贴板',
        type: 'success'
      });
    }).catch(err => {
      console.error('Could not copy text: ', err);
    });
  }