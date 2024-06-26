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
                path: 'edit-profile',
                name: 'edit-profile',
                meta: {
                    pageName: '编辑个人资料'
                },
                component: () => import('@/desktop/views/EditProfile.vue')
            }        
        ]
    },
    {
        path: '/invitation/:roomId',
        name: 'invitation',
        component: () => import('@/universal/views/Invitation.vue')
    },
    {
        path: '/games',
        name: 'games',
        component: EmptyContainer,
        children: [
            {
                path: 'schulte-grid',
                name: 'schulte-grid',
                component: EmptyContainer,
                children: [
                  {
                    path: 'game/:roomId',
                    name: 'schulte-grid-game',
                    component: () => import('@/desktop/views/game/SchulteGrid.vue')
                  }, 
                  {
                    path: 'room/:roomId',
                    name: 'schulte-grid-room',
                    component: () => import('@/desktop/views/room/WaitingRoom.vue')
                  }
                ]
            },
            {
                path: 'cypher-challenge',
                name: 'cypher-challenge',
                component: EmptyContainer,
                children: [
                  {
                    path: 'game/:roomId',
                    name: 'cypher-challenge-game',
                    component: () => import('@/desktop/views/game/CypherChallenge.vue')
                  },
                  {
                    path: 'room/:roomId',
                    name: 'cypher-challenge-room',
                    component: () => import('@/desktop/views/room/WaitingRoom.vue')
                  }
                ]
            },
            {
                path: 'skin-guess',
                name: 'skin-guess',
                component: EmptyContainer,
                children: [
                  {
                    path: 'game/:roomId',
                    name: 'skin-guess-game',
                    component: () => import('@/desktop/views/game/SkinGuess.vue')
                  },
                  {
                    path: 'room/:roomId',
                    name: 'skin-guess-room',
                    component: () => import('@/desktop/views/room/WaitingRoom.vue')
                  }
                ]
            }
        ]
    }
]

export default desktopRoutes
