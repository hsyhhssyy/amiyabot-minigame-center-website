import type { RouteRecordRaw } from 'vue-router'
import EmptyContainer from '@/desktop/components/EmptyContainer.vue'

const mobileRoutes: RouteRecordRaw[] = [
    {
        path: '/m/login',
        name: 'login-mobile',
        component: () => import('@/mobile/views/Login.vue')
    },
    {
        path: '/m/logout',
        name: 'logout-mobile',
        component: () => import('@/mobile/views/Logout.vue')
    },
    {
        path: '/m/regular-home',
        name: 'regular-home-mobile',
        meta: {
            pageName: '兔兔小游戏中心'
        },
        component: () => import('@/mobile/views/RegularHome.vue'),
        children: [
            {
                path: 'room-list',
                name: 'room-list-mobile',
                meta: {
                    pageName: '游戏大厅'
                },
                component: () => import('@/mobile/views/room/RoomList.vue')
            },
            {
                path: 'create-room',
                name: 'create-room-mobile',
                meta: {
                    pageName: '创建游戏'
                },
                component: () => import('@/mobile/views/room/CreateRoom.vue')
            },
            {
                path: 'waiting-room/:roomId',
                name: 'waiting-room-mobile',
                meta: {
                    pageName: '游戏房间'
                },
                component: () => import('@/mobile/views/room/WaitingRoom.vue')
            }
        ]
    },
    {
        path: '/m/games',
        name: 'games-mobile',
        component: EmptyContainer,
        children: [
            {
                path: 'schulte-grid/:roomId',
                name: 'schulte-grid-mobile',
                component: () => import('@/mobile/views/game/SchulteGrid.vue')
            }
        ]
    },
]

export default mobileRoutes
