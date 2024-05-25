import { createRouter, createWebHashHistory } from 'vue-router'
import { getData } from '@/utils'
import EmptyContainer from '@/components/EmptyContainer.vue'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/login',
            name: 'login',
            component: () => import('@/views/Login.vue')
        },
        {
            path: '/logout',
            name: 'logout',
            component: () => import('@/views/Logout.vue')
        },
        {
            path: '/regular-home',
            name: 'regular-home',
            meta: {
                pageName: '兔兔小游戏中心'
            },
            component: () => import('@/views/RegularHome.vue'),
            children: [
                {
                    path: 'room-list',
                    name: 'room-list',
                    meta: {
                        pageName: '游戏大厅'
                    },
                    component: () => import('@/views/room/RoomList.vue')
                },
                {
                    path: 'create-room',
                    name: 'create-room',
                    meta: {
                        pageName: '创建游戏'
                    },
                    component: () => import('@/views/room/CreateRoom.vue')
                },
                {
                    path: 'waiting-room/:roomId',
                    name: 'waiting-room',
                    meta: {
                        pageName: '游戏房间'
                    },
                    component: () => import('@/views/room/WaitingRoom.vue')
                }
            ]
        },
        {
            path: '/games',
            name: 'games',
            component: EmptyContainer,
            children: [
                {
                    path: 'schulte-grid/:roomId',
                    name: 'schulte-grid',
                    component: () => import('@/views/game/SchulteGrid.vue')
                }
            ]
        }
    ]
})

router.beforeEach((to, _from, next) => {
    if (to.path !== '/' && to.path !== '/regular-home') {
        next()
        return
    }

    if (to.path === '/') {
        next('/regular-home')
        return
    }

    // 检查是否有 token
    const token = getData('jwt-token')

    if (!token) {
        next('/login')
    } else {
        next()
    }
})

export default router
