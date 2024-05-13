import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import RegularHome from '../views/homes/RegularHome.vue';
import CreateRoom from '../views/homes/CreateRoom.vue';
import JoinRoom from '../views/homes/JoinRoom.vue';
import RoomWaiting from '../views/homes/RoomWaiting.vue';
import SchulteGrid from '../views/games/SchulteGrid.vue';
import Register from '../views/Register.vue';
import QuickRegister from '../views/QuickRegister.vue';
import Logout from '../views/Logout.vue';

const routes = [
  {
    path: '/register',
    name: 'Register',
    component: Register,
  },
  {
    path: '/quickRegister',
    name: 'QuickRegister',
    component: QuickRegister,
  },
  {
    path: '/regular-home',
    name: '首页',
    component: RegularHome,
  },
  {
    path: '/regular-home/create-room',
    name: '创建房间',
    component: CreateRoom,
  },
  {
    path: '/regular-home/join-room',
    name: '加入房间',
    component: JoinRoom,
  },
  {
    path: '/regular-home/room-waiting/:roomId',
    name: '等待房间',
    component: RoomWaiting,
    props: true
  },
  {
    path: '/regular-home/games/schulte-grid/:roomId',
    name: '技能方格',
    component: SchulteGrid,
    props: true
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
  },
  {
    path: '/logout',
    name: 'Logout',
    component: Logout,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.path !== '/' && to.path !== '/developer-home' && to.path !== '/regular-home' && to.path !== '/admin-home') {
    next();
    return;
  }

  // 检查是否有 token
  const token = localStorage.getItem('jwt-token');

  if (token) {
    const role = localStorage.getItem('user-role');
    if ( (role === "开发者账户"||role === "演示开发者账户") && to.path !== '/developer-home') {
      next('/developer-home');
    } else if (role === "管理员账户" && to.path !== '/admin-home') {
      next('/admin-home');
    } else if (role !== "开发者账户" && role !== "管理员账户" && role !== "演示开发者账户" && to.path !== '/regular-home') {
      next('/regular-home');
    } else {
      next();
    }
  } else {
    // 如果没有 token，重定向到登录页
    next('/login');
  }
});

export default router;
