import { createRouter, createWebHashHistory } from 'vue-router'
import { getData } from '@/utils'
import desktopRoutes from '@/router/desktop'
import mobileRoutes from '@/router/mobile'

const router = createRouter({
    history: createWebHashHistory(import.meta.env.BASE_URL),
    routes: [...desktopRoutes, ...mobileRoutes]
})

router.beforeEach((to, _from, next) => {
    if (to.path !== '/' && to.path !== '/regular-home' && to.path !== '/m/' && to.path !== '/m/regular-home') {
        next()
        return
    }

    if (window.innerWidth < 768 && !to.path.startsWith('/m/')) {
        next(`/m${to.path}`)
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
        if (to.path.startsWith('/m/')) {
            next('/m/login')
        } else {
            next('/login')
        }
    } else {
        next()
    }
})

export default router
