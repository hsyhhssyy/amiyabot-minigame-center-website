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
                path: 'edit-profile',
                name: 'edit-profile-mobile',
                meta: {
                    pageName: '编辑个人资料'
                },
                component: () => import('@/mobile/views/EditProfile.vue')
            }
        ]
    },
    {
        path: '/m/games',
        name: 'games-mobile',
        component: EmptyContainer,
        children: [
            {
                path: 'schulte-grid',
                name: 'schulte-grid-mobile',
                component: () => EmptyContainer,
                children: [
                  {
                    path: 'game/:roomId',
                    name: 'schulte-grid-game-mobile',
                    component: () => import('@/mobile/views/game/SchulteGrid.vue')
                  }, 
                  {
                    path: 'room/:roomId',
                    name: 'schulte-grid-room-mobile',
                    component: () => import('@/mobile/views/room/WaitingRoom.vue')
                  }
                ]
            },
            {
                path: 'cypher-challenge',
                name: 'cypher-challenge-mobile',
                component: () => EmptyContainer,
                children: [
                  {
                    path: 'game/:roomId',
                    name: 'cypher-challenge-game-mobile',
                    component: () => import('@/mobile/views/game/CypherChallenge.vue')
                  },
                  {
                    path: 'room/:roomId',
                    name: 'cypher-challenge-room-mobile',
                    component: () => import('@/mobile/views/room/WaitingRoom.vue')
                  }
                ]
            },
            {
                path: 'not-imp/:roomId',
                name: 'not-imp-m',
                component: () => import('@/mobile/MobileNotImplemented.vue')
            }
        ]
    },
]

export default mobileRoutes
