import type { RouteRecordRaw } from 'vue-router'
import EmptyContainer from '@/desktop/components/EmptyContainer.vue'

const mobileRoutes: RouteRecordRaw[] = [
    {
        path: '/m',
        name: 'mobile',
        component: EmptyContainer,
        children: [
            {
                path: 'login',
                name: 'm-login',
                component: () => import('@/mobile/views/Login.vue')
            }
        ]
    }
]

export default mobileRoutes
