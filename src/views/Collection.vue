<template>
  <div class="collection-page">
    <div class="collection-header">
      <h1>我的合集</h1>
      <button @click="addCollection" class="add-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
        新建合集
      </button>
    </div>

    <div v-if="collections.length === 0" class="empty-state">
      <div class="empty-icon">📁</div>
      <p>暂无合集</p>
      <p class="empty-tip">创建合集来收藏你喜欢的歌曲</p>
      <button @click="addCollection" class="create-first-btn">创建第一个合集</button>
    </div>

    <div v-else class="collections-list">
      <div 
        v-for="collection in collections" 
        :key="collection.id"
        class="collection-item"
      >
        <div class="collection-header-row" @click="toggleCollection(collection.id)">
          <div class="collection-info">
            <h3 class="collection-name">{{ collection.name }}</h3>
            <p class="collection-meta">
              {{ collection.songs.length }} 首歌曲 · 
              创建于 {{ formatDate(collection.createdAt) }}
            </p>
          </div>
          <div class="collection-actions">
            <button 
              @click.stop="editCollection(collection)"
              class="action-btn edit-btn"
              title="编辑合集"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button 
              @click.stop="deleteCollection(collection.id)"
              class="action-btn delete-btn"
              title="删除合集"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
              </svg>
            </button>
            <button class="expand-btn" :class="{ expanded: collection.expanded }">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="collection.expanded" class="collection-content">
          <div v-if="collection.songs.length === 0" class="empty-collection">
            <p>该合集暂无歌曲</p>
            <button @click="addSongToCollection(collection.id)" class="add-song-btn">
              添加歌曲
            </button>
          </div>
          
          <div v-else class="songs-list">
            <div 
              v-for="(song, index) in collection.songs" 
              :key="song.id"
              class="song-item"
            >
              <div class="song-index">{{ index + 1 }}</div>
              <div class="song-info">
                <h4 class="song-title">{{ song.title }}</h4>
                <p class="song-artist">{{ song.artist }}</p>
              </div>
              <div class="song-actions">
                <button 
                  @click="playLyrics(song)"
                  class="action-btn play-btn"
                  title="查看歌词"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </button>
                <button 
                  @click="removeSongFromCollection(collection.id, song.id)"
                  class="action-btn remove-btn"
                  title="从合集中移除"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 新建/编辑合集弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <h3>{{ editingCollection ? '编辑合集' : '新建合集' }}</h3>
        <div class="form-group">
          <label>合集名称</label>
          <input 
            v-model="modalForm.name"
            type="text"
            placeholder="请输入合集名称"
            class="form-input"
            @keyup.enter="saveCollection"
          />
        </div>
        <div class="form-group">
          <label>描述（可选）</label>
          <textarea 
            v-model="modalForm.description"
            placeholder="请输入合集描述"
            class="form-textarea"
            rows="3"
          ></textarea>
        </div>
        <div class="modal-actions">
          <button @click="closeModal" class="cancel-btn">取消</button>
          <button 
            @click="saveCollection" 
            :disabled="!modalForm.name.trim()"
            class="save-btn"
          >
            {{ editingCollection ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Collection',
  data() {
    return {
      collections: [],
      showModal: false,
      editingCollection: null,
      modalForm: {
        name: '',
        description: ''
      }
    }
  },
  mounted() {
    this.loadCollections()
  },
  methods: {
    loadCollections() {
      // 从本地存储加载合集数据
      const saved = localStorage.getItem('musicCollections')
      if (saved) {
        this.collections = JSON.parse(saved).map(collection => ({
          ...collection,
          expanded: false // 默认折叠状态
        }))
      } else {
        // 初始化示例数据
        this.collections = [
          {
            id: 1,
            name: '我的最爱',
            description: '收藏的经典歌曲',
            createdAt: new Date().toISOString(),
            expanded: false,
            songs: [
              {
                id: 'demo1',
                title: '示例歌曲1',
                artist: '示例歌手1',
                source: 1
              },
              {
                id: 'demo2',
                title: '示例歌曲2',
                artist: '示例歌手2',
                source: 0
              }
            ]
          },
          {
            id: 2,
            name: '流行金曲',
            description: '热门流行歌曲合集',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            expanded: false,
            songs: []
          }
        ]
        this.saveCollections()
      }
    },

    saveCollections() {
      // 保存到本地存储，不包含expanded状态
      const toSave = this.collections.map(({ expanded, ...collection }) => collection)
      localStorage.setItem('musicCollections', JSON.stringify(toSave))
    },

    toggleCollection(id) {
      const collection = this.collections.find(c => c.id === id)
      if (collection) {
        collection.expanded = !collection.expanded
      }
    },

    addCollection() {
      this.editingCollection = null
      this.modalForm = {
        name: '',
        description: ''
      }
      this.showModal = true
    },

    editCollection(collection) {
      this.editingCollection = collection
      this.modalForm = {
        name: collection.name,
        description: collection.description || ''
      }
      this.showModal = true
    },

    saveCollection() {
      if (!this.modalForm.name.trim()) return

      if (this.editingCollection) {
        // 编辑现有合集
        this.editingCollection.name = this.modalForm.name.trim()
        this.editingCollection.description = this.modalForm.description.trim()
      } else {
        // 创建新合集
        const newCollection = {
          id: Date.now(),
          name: this.modalForm.name.trim(),
          description: this.modalForm.description.trim(),
          createdAt: new Date().toISOString(),
          expanded: false,
          songs: []
        }
        this.collections.unshift(newCollection)
      }

      this.saveCollections()
      this.closeModal()
    },

    deleteCollection(id) {
      if (confirm('确定要删除这个合集吗？此操作不可恢复。')) {
        this.collections = this.collections.filter(c => c.id !== id)
        this.saveCollections()
      }
    },

    closeModal() {
      this.showModal = false
      this.editingCollection = null
    },

    addSongToCollection(collectionId) {
      // 这里可以跳转到搜索页面或显示歌曲选择器
      this.$router.push('/search')
    },

    playLyrics(song) {
      // 跳转到歌词页面
      this.$router.push({
        path: '/lyrics',
        query: {
          id: song.id,
          source: song.source,
          title: song.title,
          artist: song.artist
        }
      })
    },

    removeSongFromCollection(collectionId, songId) {
      const collection = this.collections.find(c => c.id === collectionId)
      if (collection) {
        collection.songs = collection.songs.filter(s => s.id !== songId)
        this.saveCollections()
      }
    },

    formatDate(dateString) {
      const date = new Date(dateString)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }
}
</script>

<style scoped>
.collection-page {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
}

.collection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.collection-header h1 {
  color: #333;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #1976d2;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-btn:hover {
  background: #1565c0;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #666;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 20px;
}

.empty-tip {
  font-size: 14px;
  color: #999;
  margin: 8px 0 24px 0;
}

.create-first-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.create-first-btn:hover {
  background: #1565c0;
}

.collections-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.collection-item {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.collection-item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.collection-header-row {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.collection-header-row:hover {
  background: #f8f9fa;
}

.collection-info {
  flex: 1;
}

.collection-name {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.collection-meta {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.collection-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  background: transparent;
  border: none;
  color: #666;
  padding: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.delete-btn:hover {
  background: #ffebee;
  color: #f44336;
}

.expand-btn {
  transition: transform 0.3s ease;
}

.expand-btn.expanded {
  transform: rotate(180deg);
}

.collection-content {
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}

.empty-collection {
  padding: 40px 20px;
  text-align: center;
  color: #666;
}

.add-song-btn {
  background: #1976d2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  margin-top: 12px;
}

.songs-list {
  padding: 16px 20px;
}

.song-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #e0e0e0;
}

.song-item:last-child {
  border-bottom: none;
}

.song-index {
  width: 24px;
  height: 24px;
  background: #e0e0e0;
  color: #666;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.song-info {
  flex: 1;
}

.song-title {
  margin: 0 0 2px 0;
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.song-artist {
  margin: 0;
  font-size: 13px;
  color: #666;
}

.song-actions {
  display: flex;
  gap: 4px;
}

.play-btn:hover {
  background: #e3f2fd;
  color: #1976d2;
}

.remove-btn:hover {
  background: #ffebee;
  color: #f44336;
}

/* 弹窗样式 */
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
  padding: 24px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.3s ease;
  resize: vertical;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #1976d2;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn {
  background: #f5f5f5;
  color: #666;
}

.cancel-btn:hover {
  background: #e0e0e0;
}

.save-btn {
  background: #1976d2;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #1565c0;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .collection-page {
    padding: 15px;
  }
  
  .collection-header {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }
  
  .collection-header h1 {
    text-align: center;
  }
  
  .collection-header-row {
    padding: 16px;
  }
  
  .collection-name {
    font-size: 16px;
  }
  
  .song-item {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .song-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .modal-content {
    margin: 20px;
    width: auto;
  }
}
</style>