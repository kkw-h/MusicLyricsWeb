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
            <h4 class="song-title">{{ song.name }}</h4>
            <p class="song-artist">{{ song.artist }}</p>
            <p class="song-album" v-if="song.album">{{ song.album }}</p>
            <p class="song-platform" v-if="song.platform_name">{{ song.platform_name }}</p>
          </div>
          <div class="song-actions">
            <button 
              @click.stop="addToCollection(song)"
              class="action-btn collection-btn"
            >
              添加到合集
            </button>
            <button 
              @click.stop="viewLyrics(song)"
              class="play-btn"
              title="查看歌词"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
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

    <!-- 添加到合集的模态框 -->
    <div v-if="showCollectionModal" class="modal-overlay" @click="closeCollectionModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>添加到合集</h3>
          <button @click="closeCollectionModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="selected-song-info">
            <h4>{{ selectedSong?.name || selectedSong?.title }}</h4>
            <p>{{ selectedSong?.artist || selectedSong?.singer }}</p>
          </div>
          
          <div v-if="collections.length === 0" class="no-collections">
            <p>暂无合集，请先创建一个合集</p>
            <button @click="createNewCollection" class="create-collection-btn">
              创建新合集
            </button>
          </div>
          
          <div v-else class="collections-list">
            <h4>选择合集：</h4>
            <div 
              v-for="collection in collections" 
              :key="collection.id"
              class="collection-option"
              @click="addSongToCollection(collection.id)"
            >
              <div class="collection-info">
                <span class="collection-name">{{ collection.name }}</span>
                <span class="collection-count">{{ collection.songs.length }} 首歌曲</span>
              </div>
              <div class="collection-arrow">→</div>
            </div>
            
            <button @click="createNewCollection" class="create-new-btn">
              + 创建新合集
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建新合集的模态框 -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>创建新合集</h3>
          <button @click="closeCreateModal" class="close-btn">×</button>
        </div>
        
        <div class="modal-body">
          <div class="form-group">
            <label>合集名称：</label>
            <input 
              v-model="newCollectionName" 
              type="text" 
              placeholder="请输入合集名称"
              class="form-input"
              @keyup.enter="createAndAddToCollection"
            />
          </div>
          
          <div class="form-group">
            <label>合集描述：</label>
            <textarea 
              v-model="newCollectionDescription" 
              placeholder="请输入合集描述（可选）"
              class="form-textarea"
            ></textarea>
          </div>
          
          <div class="modal-actions">
            <button @click="closeCreateModal" class="cancel-btn">取消</button>
            <button 
              @click="createAndAddToCollection" 
              :disabled="!newCollectionName.trim()"
              class="confirm-btn"
            >
              创建并添加
            </button>
          </div>
        </div>
      </div>
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
      error: null,
      // 合集相关数据
      collections: [],
      showCollectionModal: false,
      showCreateModal: false,
      selectedSong: null,
      newCollectionName: '',
      newCollectionDescription: ''
    }
  },
  mounted() {
    this.loadCollections()
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
        
        // 检查API返回状态
        if (response.code === 200 && response.data && response.data.songs) {
          this.searchResults = response.data.songs
        } else {
          this.error = response.message || '搜索失败，请稍后重试'
          this.searchResults = []
        }
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
          title: song.name,
          artist: song.artist
        }
      })
    },
    
    clearError() {
      this.error = null
    },

    // 合集相关方法
    loadCollections() {
      const saved = localStorage.getItem('musicCollections')
      if (saved) {
        this.collections = JSON.parse(saved)
      }
    },

    saveCollections() {
      localStorage.setItem('musicCollections', JSON.stringify(this.collections))
    },

    addToCollection(song) {
      this.selectedSong = song
      this.showCollectionModal = true
    },

    closeCollectionModal() {
      this.showCollectionModal = false
      this.selectedSong = null
    },

    createNewCollection() {
      this.showCollectionModal = false
      this.showCreateModal = true
    },

    closeCreateModal() {
      this.showCreateModal = false
      this.newCollectionName = ''
      this.newCollectionDescription = ''
    },

    addSongToCollection(collectionId) {
      const collection = this.collections.find(c => c.id === collectionId)
      if (collection && this.selectedSong) {
        // 检查歌曲是否已存在
        const songExists = collection.songs.some(s => 
          s.id === this.selectedSong.id && s.source === this.selectedPlatform
        )
        
        if (songExists) {
          alert('该歌曲已在此合集中')
          return
        }

        // 添加歌曲到合集
        const songToAdd = {
          id: this.selectedSong.id,
          title: this.selectedSong.name,
          artist: this.selectedSong.artist,
          album: this.selectedSong.album,
          source: this.selectedPlatform,
          addedAt: new Date().toISOString()
        }
        
        collection.songs.push(songToAdd)
        this.saveCollections()
        
        alert(`已添加到合集"${collection.name}"`)
        this.closeCollectionModal()
      }
    },

    createAndAddToCollection() {
      if (!this.newCollectionName.trim()) return

      // 创建新合集
      const newCollection = {
        id: Date.now(),
        name: this.newCollectionName.trim(),
        description: this.newCollectionDescription.trim(),
        createdAt: new Date().toISOString(),
        songs: []
      }

      // 如果有选中的歌曲，直接添加到新合集
      if (this.selectedSong) {
        const songToAdd = {
          id: this.selectedSong.id,
          title: this.selectedSong.name,
          artist: this.selectedSong.artist,
          album: this.selectedSong.album,
          source: this.selectedPlatform,
          addedAt: new Date().toISOString()
        }
        newCollection.songs.push(songToAdd)
      }

      this.collections.unshift(newCollection)
      this.saveCollections()
      
      alert(`已创建合集"${newCollection.name}"${this.selectedSong ? '并添加歌曲' : ''}`)
      this.closeCreateModal()
      this.closeCollectionModal()
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .song-item {
    padding: 12px 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .song-actions {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
  
  .collection-btn {
    flex: 1;
    max-width: 150px;
  }
  
  .play-btn {
    margin-left: 0;
  }
}

@media (max-width: 480px) {
  .song-item {
    padding: 10px 12px;
  }
  
  .song-title {
    font-size: 15px;
  }
  
  .song-artist {
    font-size: 13px;
  }
  
  .collection-btn {
    padding: 6px 12px;
    font-size: 12px;
  }
  
  .play-btn {
    width: 36px;
    height: 36px;
  }
  
  .play-btn svg {
    width: 18px;
    height: 18px;
  }
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

.collection-btn {
  background: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.collection-btn:hover {
  background: #45a049;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(76, 175, 80, 0.3);
}

/* 播放按钮样式 */
.play-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: #f5f5f5;
  color: #1976d2;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  margin-left: 10px;
  flex-shrink: 0;
}

.play-btn:hover {
  background: #1976d2;
  color: white;
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.3);
}

.play-btn svg {
  transition: transform 0.2s ease;
}

.play-btn:hover svg {
  transform: translateX(1px);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #666;
}

.modal-body {
  padding: 20px;
}

.selected-song-info {
  background: #f5f5f5;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.selected-song-info h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.selected-song-info p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.no-collections {
  text-align: center;
  padding: 20px;
}

.no-collections p {
  color: #666;
  margin-bottom: 15px;
}

.create-collection-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.create-collection-btn:hover {
  background: #1565c0;
}

.collections-list h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.collection-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.collection-option:hover {
  background: #f5f5f5;
  border-color: #1976d2;
}

.collection-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.collection-name {
  font-weight: 500;
  color: #333;
}

.collection-count {
  font-size: 12px;
  color: #666;
}

.collection-arrow {
  color: #1976d2;
  font-weight: bold;
}

.create-new-btn {
  width: 100%;
  background: #f5f5f5;
  border: 1px dashed #ccc;
  color: #666;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  margin-top: 10px;
  transition: all 0.3s ease;
}

.create-new-btn:hover {
  background: #e8f5e8;
  border-color: #4caf50;
  color: #4caf50;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  color: #333;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #1976d2;
}

.form-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
}

.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.cancel-btn:hover {
  background: #e8e8e8;
}

.confirm-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.confirm-btn:hover {
  background: #1565c0;
}

.confirm-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
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

.song-platform {
  margin: 2px 0 0 0;
  font-size: 11px;
  color: #1976d2;
  font-weight: 500;
  background: rgba(25, 118, 210, 0.1);
  padding: 2px 6px;
  border-radius: 10px;
  display: inline-block;
}
</style>