<template>
  <div class="share-page">
    <div class="container">
      <!-- 头部 -->
      <div class="header">
        <button @click="goBack" class="back-btn">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <h1>分享的歌单</h1>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在加载歌单...</p>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="error">
        <div class="error-icon">⚠️</div>
        <h3>加载失败</h3>
        <p>{{ error }}</p>
        <button @click="goBack" class="retry-btn">返回</button>
      </div>

      <!-- 歌单内容 -->
      <div v-else-if="collection" class="collection-content">
        <!-- 歌单信息 -->
        <div class="collection-info">
          <h2>{{ collection.name }}</h2>
          <p v-if="collection.description" class="description">{{ collection.description }}</p>
          <div class="meta">
            <span class="song-count">{{ collection.songs.length }} 首歌曲</span>
            <span class="share-time">分享时间：{{ formatDate(collection.shareTime) }}</span>
          </div>
        </div>

        <!-- 歌曲列表 -->
        <div class="songs-section">
          <h3>歌曲列表</h3>
          <div class="songs-list">
            <div v-for="(song, index) in collection.songs" :key="index" class="song-item">
              <div class="song-info">
                <h4>{{ song.title }}</h4>
                <p>{{ song.artist }}</p>
              </div>
              <button @click="playLyrics(song)" class="play-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M8 5V19L19 12L8 5Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 导入按钮 -->
        <div class="import-section">
          <button @click="importCollection" :disabled="importing" class="import-btn">
            <svg v-if="!importing" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12L12 5L19 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <div v-else class="spinner-small"></div>
            {{ importing ? '导入中...' : '一键导入到我的合集' }}
          </button>
          <p class="import-tip">导入后，这个歌单将添加到您的合集中</p>
          
          <!-- 复制链接按钮 -->
          <button @click="copyShareLink" class="copy-link-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
            </svg>
            复制分享链接
          </button>
        </div>
      </div>
    </div>

    <!-- 成功提示 -->
    <div v-if="showSuccess" class="success-toast">
      <div class="toast-content">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ successMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Share',
  data() {
    return {
      collection: null,
      loading: true,
      error: null,
      importing: false,
      showSuccess: false,
      successMessage: '歌单导入成功！'
    }
  },
  mounted() {
    this.loadSharedCollection()
  },
  methods: {
    loadSharedCollection() {
      try {
        // 从URL参数中获取分享的歌单数据
        const urlParams = new URLSearchParams(window.location.search)
        const collectionData = urlParams.get('data')
        
        if (!collectionData) {
          this.error = '无效的分享链接'
          this.loading = false
          return
        }

        // 解码并解析歌单数据
        const decodedData = decodeURIComponent(collectionData)
        this.collection = JSON.parse(decodedData)
        this.collection.shareTime = Date.now()
        this.loading = false
      } catch (err) {
        console.error('解析分享数据失败:', err)
        this.error = '分享链接格式错误'
        this.loading = false
      }
    },
    
    async importCollection() {
      if (!this.collection || this.importing) return
      
      this.importing = true
      
      try {
        // 获取现有合集
        const existingCollections = JSON.parse(localStorage.getItem('musicCollections') || '[]')
        
        // 检查是否已存在同名合集
        const existingIndex = existingCollections.findIndex(c => c.name === this.collection.name)
        
        if (existingIndex !== -1) {
          // 如果存在同名合集，询问用户是否覆盖
          const shouldOverwrite = confirm(`合集"${this.collection.name}"已存在，是否覆盖？`)
          if (shouldOverwrite) {
            existingCollections[existingIndex] = {
              ...this.collection,
              id: existingCollections[existingIndex].id,
              createdAt: existingCollections[existingIndex].createdAt,
              updatedAt: Date.now()
            }
          } else {
            // 创建新的合集名称
            let newName = `${this.collection.name} (副本)`
            let counter = 1
            while (existingCollections.some(c => c.name === newName)) {
              counter++
              newName = `${this.collection.name} (副本${counter})`
            }
            
            const newCollection = {
              ...this.collection,
              name: newName,
              id: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now()
            }
            existingCollections.push(newCollection)
          }
        } else {
          // 添加新合集
          const newCollection = {
            ...this.collection,
            id: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          existingCollections.push(newCollection)
        }
        
        // 保存到本地存储
        localStorage.setItem('musicCollections', JSON.stringify(existingCollections))
        
        // 显示成功提示
        this.successMessage = '歌单导入成功！'
        this.showSuccess = true
        setTimeout(() => {
          this.showSuccess = false
          // 跳转到合集页面
          this.$router.push('/collection')
        }, 2000)
        
      } catch (err) {
        console.error('导入合集失败:', err)
        alert('导入失败，请重试')
      } finally {
        this.importing = false
      }
    },
    
    copyShareLink() {
      try {
        // 获取当前页面的完整URL作为分享链接
        const shareUrl = window.location.href
        
        // 使用现代浏览器的Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            this.showCopySuccess()
          }).catch(() => {
            this.fallbackCopyToClipboard(shareUrl)
          })
        } else {
          // 降级方案：使用传统方法
          this.fallbackCopyToClipboard(shareUrl)
        }
      } catch (error) {
        console.error('复制分享链接失败:', error)
        alert('复制失败，请手动复制链接')
      }
    },
    
    fallbackCopyToClipboard(text) {
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        textArea.style.position = 'fixed'
        textArea.style.left = '-999999px'
        textArea.style.top = '-999999px'
        document.body.appendChild(textArea)
        textArea.focus()
        textArea.select()
        
        const successful = document.execCommand('copy')
        document.body.removeChild(textArea)
        
        if (successful) {
          this.showCopySuccess()
        } else {
          alert('复制失败，请手动复制链接')
        }
      } catch (error) {
        console.error('降级复制方法失败:', error)
        alert('复制失败，请手动复制链接')
      }
    },
    
    showCopySuccess() {
      // 显示复制成功提示
      this.successMessage = '分享链接已复制到剪切板！'
      this.showSuccess = true
      setTimeout(() => {
        this.showSuccess = false
      }, 2000)
    },
    
    playLyrics(song) {
      // 跳转到歌词页面
      this.$router.push({
        path: '/lyrics',
        query: {
          title: song.title,
          artist: song.artist
        }
      })
    },
    
    goBack() {
      // 返回上一页或首页
      if (window.history.length > 1) {
        this.$router.go(-1)
      } else {
        this.$router.push('/')
      }
    },
    
    formatDate(timestamp) {
      const date = new Date(timestamp)
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }
}
</script>

<style scoped>
.share-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px 0;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 头部样式 */
.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px 0;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateX(-2px);
}

.header h1 {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

/* 加载和错误状态 */
.loading, .error {
  text-align: center;
  padding: 60px 20px;
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.error-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
}

.error p {
  margin: 0 0 24px 0;
  opacity: 0.8;
}

.retry-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 歌单内容 */
.collection-content {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.collection-info {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  text-align: center;
}

.collection-info h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.description {
  margin: 0 0 16px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.meta {
  display: flex;
  justify-content: center;
  gap: 16px;
  font-size: 12px;
  color: #888;
}

/* 歌曲列表 */
.songs-section {
  padding: 24px;
}

.songs-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.songs-list {
  max-height: 300px;
  overflow-y: auto;
}

.song-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.song-item:last-child {
  border-bottom: none;
}

.song-info h4 {
  margin: 0 0 4px 0;
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.song-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.play-btn {
  background: #1976d2;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
}

.play-btn:hover {
  background: #1565c0;
  transform: scale(1.1);
}

/* 导入区域 */
.import-section {
  padding: 24px;
  background: #f8f9fa;
  text-align: center;
}

.import-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #4caf50;
  color: white;
  border: none;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto 12px;
  min-width: 200px;
}

.import-btn:hover:not(:disabled) {
  background: #45a049;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.import-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.import-tip {
  margin: 0 0 16px 0;
  font-size: 12px;
  color: #666;
}

/* 复制链接按钮 */
.copy-link-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto;
  min-width: 180px;
}

.copy-link-btn:hover {
  background: #1565c0;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.3);
}

/* 成功提示 */
.success-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 16px 24px;
  border-radius: 8px;
  z-index: 1000;
  animation: fadeInOut 2s ease-in-out;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes fadeInOut {
  0%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
  20%, 80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
  
  .header h1 {
    font-size: 20px;
  }
  
  .collection-info {
    padding: 20px 16px;
  }
  
  .songs-section {
    padding: 20px 16px;
  }
  
  .import-section {
    padding: 20px 16px;
  }
  
  .import-btn {
    padding: 14px 24px;
    font-size: 14px;
    min-width: 180px;
  }
  
  .meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>