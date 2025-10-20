<template>
  <div class="app">
    <main class="main-content">
      <router-view />
    </main>
    
    <nav class="bottom-nav">
      <router-link 
        v-for="item in navItems" 
        :key="item.path"
        :to="item.path" 
        class="nav-item"
        :class="{ active: $route.path === item.path }"
      >
        <div class="nav-icon">
          <svg v-html="item.icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"></svg>
        </div>
        <span class="nav-text">{{ item.name }}</span>
      </router-link>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      navItems: [
        {
          path: '/search',
          name: '搜索',
          icon: '<path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>'
        },
        {
          path: '/lyrics',
          name: '歌词',
          icon: '<path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>'
        },
        {
          path: '/collection',
          name: '合集',
          icon: '<path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>'
        }
      ]
    }
  }
}
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding-bottom: 70px;
  overflow-y: auto;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: #fff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  text-decoration: none;
  color: #666;
  transition: all 0.3s ease;
}

.nav-item.active {
  color: #1976d2;
}

.nav-icon {
  margin-bottom: 4px;
  transition: transform 0.2s ease;
}

.nav-item:active .nav-icon {
  transform: scale(0.95);
}

.nav-text {
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 480px) {
  .nav-text {
    font-size: 11px;
  }
  
  .bottom-nav {
    height: 65px;
  }
  
  .main-content {
    padding-bottom: 65px;
  }
}
</style>