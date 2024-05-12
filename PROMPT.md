Vite+TypeScript+Vue3+响应式+ElementPlus
使用<script lang="ts" setup>

请帮我写一个列表页,可以根据api返回的列表,列出该连接当前的所有任务.

任务分为 序号,发出时间,任务类型,完成时间,执行结果(成功/失败),以及一个可选的链接:"查看结果"
按照发出时间倒序.
注意提供分页和按页跳转.

我有一个首页的<router-view></router-view>, 所有子页面都在上面显示
我想要实现一个效果,那就是我点击'MAA连接'页面中的一个连接，应该导航到'任务列表'，然后面包屑显示 首页/MAA连接/任务列表，
但是我不想在'MAA连接'中放置嵌套的<router-view></router-view>，因为任务列表不应该是嵌套页面，打开任务列表时，应该看不到MAA连接了，但是面包屑上他们是父子关系,我该怎么配置router或者面包屑?
给出代码时,请使用<script lang="ts" setup>

vue，使用vue-router，请写一段代码，根据给定一个router的name，输出一个数组,他的内容类似route.matched的格式
表示如果当前路由在这个router上时,route的扁平化结构.
只需要包含route.path和route.name即可,剩下的值我不需要
给出代码时,请使用<script lang="ts" setup>

    

// 如果是二级菜单，就在一级菜单后面插入
var parent = routeRecord.meta.parent;
const resolved = router.resolve({ name: parent });


请为我用ElementPlus写一个页面，你只需要提供template部分
这个页面是一个对话框，需要用户提供下面这些内容：
1、任务类型，这是一个枚举值，是CaptureImage（截图），LinkStart（一键长草），LinkStart-Combat（刷理智）
2、任务参数
对于不同任务，任务参数会不一样，当用户选择任务类型后，任务参数面板部分将会发生变化来让用户输入不同的参数。

截图，一键长草任务没有参数
刷理智有一个枚举参数：关卡，它的取值是“1-7”，“CE-6”,"ZT-8","ZT-9","ZT-10"
开始唤醒有一个字符串参数: 连接地址

然后含有一个提交按钮和一个取消按钮.


接下来请提供script部分,请使用<script lang="ts" setup>,并且使用Vue3,响应式语法