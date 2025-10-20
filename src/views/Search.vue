<template>
  <div class="search-page">
    <div class="search-header">
      <h1>音乐搜索</h1>
    </div>
    
    <div class="search-form">
      <div class="input-group">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="请输入歌曲名称"
          class="search-input"
          @keyup.enter="handleSearch"
          value="大石碎胸口"
        />
        <button 
          @click="handleSearch" 
          :disabled="!searchQuery.trim() || loading"
          class="search-btn"
        >
          <span v-if="loading">搜索中...</span>
          <span v-else>搜索</span>
        </button>
      </div>
      
      <div class="platform-selector">
        <label class="platform-label">音乐平台：</label>
        <div class="platform-options">
          <label class="platform-option">
            <input 
              type="radio" 
              v-model="selectedPlatform" 
              :value="1"
              name="platform"
            />
            <span>QQ音乐</span>
          </label>
          <label class="platform-option">
            <input 
              type="radio" 
              v-model="selectedPlatform" 
              :value="0"
              name="platform"
            />
            <span>网易云音乐</span>
          </label>
        </div>
      </div>
    </div>
    
    <div class="search-results" v-if="searchResults.length > 0 || loading">
      <div class="results-header">
        <h3>搜索结果</h3>
        <span class="results-count" v-if="!loading">共 {{ searchResults.length }} 首歌曲</span>
      </div>
      
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>正在搜索歌曲...</p>
      </div>
      
      <div v-else class="results-list">
        <div 
          v-for="song in searchResults" 
          :key="song.id"
          class="song-item"
          @click="selectSong(song)"
        >
          <div class="song-info">
            <h4 class="song-title">{{ song.name || song.title }}</h4>
            <p class="song-artist">{{ song.artist || song.singer }}</p>
            <p class="song-album" v-if="song.album">{{ song.album }}</p>
          </div>
          <div class="song-actions">
            <button 
              @click.stop="viewLyrics(song)"
              class="action-btn lyrics-btn"
            >
              查看歌词
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else-if="hasSearched && !loading" class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>未找到相关歌曲</p>
      <p class="empty-tip">请尝试其他关键词或切换音乐平台</p>
    </div>
    
    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="clearError" class="clear-error-btn">关闭</button>
    </div>
  </div>
</template>

<script>
import { musicAPI } from '../api/music.js'

export default {
  name: 'Search',
  data() {
    return {
      searchQuery: '',
      selectedPlatform: 1, // 默认QQ音乐
      searchResults: [],
      loading: false,
      hasSearched: false,
      error: null
    }
  },
  methods: {
    async handleSearch() {
      if (!this.searchQuery.trim()) return
      
      this.loading = true
      this.error = null
      this.hasSearched = true
      
      try {
        const params = {
          name: this.searchQuery.trim(),
          source: this.selectedPlatform,
          limit: 20
        }
        
        const response = await musicAPI.searchSongs(params)
        this.searchResults = response.songs || response || []
      } catch (error) {
        console.error('搜索失败:', error)
        this.error = '搜索失败，请检查网络连接或稍后重试'
        this.searchResults = []
      } finally {
        this.loading = false
      }
    },
    
    selectSong(song) {
      // 可以添加选中歌曲的逻辑，比如保存到本地存储
      console.log('选中歌曲:', song)
    },
    
    viewLyrics(song) {
      // 跳转到歌词页面，传递歌曲信息
      this.$router.push({
        path: '/lyrics',
        query: {
          id: song.id,
          source: this.selectedPlatform,
          title: song.name || song.title,
          artist: song.artist || song.singer
        }
      })
    },
    
    clearError() {
      this.error = null
    }
  }
}
</script>

<style scoped>
.search-page {
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
}

.search-header {
  text-align: center;
  margin-bottom: 30px;
}

.search-header h1 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.search-form {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #1976d2;
}

.search-btn {
  padding: 12px 24px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
  min-width: 80px;
}

.search-btn:hover:not(:disabled) {
  background: #1565c0;
}

.search-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.platform-selector {
  display: flex;
  align-items: center;
  gap: 15px;
}

.platform-label {
  font-weight: 500;
  color: #333;
}

.platform-options {
  display: flex;
  gap: 20px;
}

.platform-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
}

.platform-option input[type="radio"] {
  margin: 0;
}

.search-results {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.results-header {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.results-header h3 {
  margin: 0;
  color: #333;
}

.results-count {
  color: #666;
  font-size: 14px;
}

.loading-state {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f0f0f0;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.results-list {
  max-height: 400px;
  overflow-y: auto;
}

.song-item {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.song-item:hover {
  background: #f8f9fa;
}

.song-item:last-child {
  border-bottom: none;
}

.song-info {
  flex: 1;
}

.song-title {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.song-artist {
  margin: 0 0 2px 0;
  font-size: 14px;
  color: #666;
}

.song-album {
  margin: 0;
  font-size: 12px;
  color: #999;
}

.song-actions {
  margin-left: 15px;
}

.action-btn {
  padding: 6px 12px;
  border: 1px solid #1976d2;
  background: transparent;
  color: #1976d2;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #1976d2;
  color: white;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-tip {
  font-size: 14px;
  color: #999;
  margin-top: 8px;
}

.error-message {
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.clear-error-btn {
  background: none;
  border: none;
  color: #c62828;
  cursor: pointer;
  font-size: 14px;
  text-decoration: underline;
}

@media (max-width: 480px) {
  .search-page {
    padding: 15px;
  }
  
  .input-group {
    flex-direction: column;
  }
  
  .search-btn {
    width: 100%;
  }
  
  .platform-selector {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .song-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .song-actions {
    margin-left: 0;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
  }
}
</style>