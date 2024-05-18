import { createRouter,createWebHashHistory } from 'vue-router';
import Login from '../views/Login.vue';
import RegularHome from '../views/homes/RegularHome.vue';
import CreateRoom from '../views/homes/CreateRoom.vue';
import JoinRoom from '../views/homes/JoinRoom.vue';
import RoomWaiting from '../views/homes/RoomWaiting.vue';
import SchulteGrid from '../views/games/SchulteGrid.vue';
import SkinGuess from '../views/games/SkinGuess.vue';
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
    path: '/regular-home/games/skin-guess/:roomId',
    name: '立绘猜干员',
    component: SkinGuess,
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
  history: createWebHashHistory(),
  routes,
});

router.beforeEach((to, _from, next) => {
  if (to.path !== '/' && to.path !== '/regular-home') {
    next();
    return;
  }

  if(to.path==='/'){
    next('/regular-home');
    return;
  }

  // 检查是否有 token
  const token = localStorage.getItem('jwt-token');

  if (!token) {
    next('/login');
  }else{
    next();
  }
});

export default router;
