import type { RouteRecordRaw } from 'vue-router'
import EmptyContainer from '@/desktop/components/EmptyContainer.vue'

const desktopRoutes: RouteRecordRaw[] = [
    {
        path: '/login',
        name: 'login',
        component: () => import('@/desktop/views/Login.vue')
    },
    {
        path: '/logout',
        name: 'logout',
        component: () => import('@/desktop/views/Logout.vue')
    },
    {
        path: '/regular-home',
        name: 'regular-home',
        meta: {
            pageName: '兔兔小游戏中心'
        },
        component: () => import('@/desktop/views/RegularHome.vue'),
        children: [
            {
                path: 'room-list',
                name: 'room-list',
                meta: {
                    pageName: '游戏大厅'
                },
                component: () => import('@/desktop/views/room/RoomList.vue')
            },
            {
                path: 'create-room',
                name: 'create-room',
                meta: {
                    pageName: '创建游戏'
                },
                component: () => import('@/desktop/views/room/CreateRoom.vue')
            },
            {
                path: 'waiting-room/:roomId',
                name: 'waiting-room',
                meta: {
                    pageName: '游戏房间'
                },
                component: () => import('@/desktop/views/room/WaitingRoom.vue')
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
                component: () => import('@/desktop/views/game/SchulteGrid.vue')
            }
        ]
    }
]

export default desktopRoutes
