import { createRouter, createWebHashHistory } from 'vue-router'
import { getData } from '@/utils'
import EmptyContainer from '@/desktop/components/EmptyContainer.vue'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [
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
        },
        // 移动端Route
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
})

router.beforeEach((to, _from, next) => {

    //移动端强制跳转
    if(window.innerWidth < 768 && to.path.startsWith('/m/') === false){
        next(`/m${to.path}`)
        return
    }


    if (to.path !== '/' && to.path !== '/regular-home' && to.path !== '/m/' && to.path !== '/m/regular-home'){
        next()
        return
    }

    if (to.path === '/') {
        next('/regular-home')
        return
    }
    
    if (to.path === '/m/') {
        next('/m/regular-home')
        return
    }

    // 检查是否有 token
    const token = getData('jwt-token')

    if (!token) {
        if(to.path.startsWith('/m/')){
            next('/m/login')
        }else{
            next('/login')
        }
    } else {
        next()
    }
})

export default router
