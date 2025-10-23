import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Search from './views/Search.vue'
import Lyrics from './views/Lyrics.vue'
import Collection from './views/Collection.vue'
import Share from './views/Share.vue'

const routes = [
  { path: '/', redirect: '/search' },
  { path: '/search', component: Search },
  { path: '/lyrics', component: Lyrics },
  { path: '/collection', component: Collection },
  { path: '/share', component: Share }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')