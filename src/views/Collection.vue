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
              @click.stop="shareCollection(collection)"
              class="action-btn share-btn"
              title="分享合集"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
              </svg>
            </button>
            <button 
              @click.stop="cacheCollectionLyrics(collection)"
              class="action-btn cache-btn"
              :class="{ 'caching': collection.caching }"
              :disabled="collection.caching || collection.songs.length === 0"
              :title="collection.caching ? '正在缓存歌词...' : '一键缓存歌词'"
            >
              <svg v-if="!collection.caching" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
              </svg>
              <div v-else class="cache-spinner"></div>
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

    <!-- 分享合集弹窗 -->
    <div v-if="showShareModal" class="modal-overlay" @click="closeShareModal">
      <div class="modal-content share-modal" @click.stop>
        <div class="share-header">
          <h3>分享合集</h3>
          <button @click="closeShareModal" class="close-btn">×</button>
        </div>
        
        <div class="share-content">
          <div class="collection-preview">
            <h4>{{ selectedCollection?.name }}</h4>
            <p class="collection-desc">{{ selectedCollection?.description || '暂无描述' }}</p>
            <p class="song-count">{{ selectedCollection?.songs?.length || 0 }} 首歌曲</p>
          </div>
          
          <div class="qr-section">
            <div class="qr-container">
              <img v-if="qrCodeDataUrl" :src="qrCodeDataUrl" alt="分享二维码" class="qr-code" />
              <div v-else class="qr-loading">
                <div class="spinner"></div>
                <span>生成二维码中...</span>
              </div>
            </div>
            <p class="qr-tip">使用微信或其他扫码工具扫描二维码<br>即可快速导入该歌单到自己的合集中</p>
          </div>
          
          <div class="share-actions">
            <button @click="copyShareLink" class="copy-btn">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
              </svg>
              复制链接
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 缓存进度显示 -->
    <div v-if="cacheProgress.show" class="cache-progress-overlay">
      <div class="cache-progress-modal">
        <div class="progress-header">
          <h3>正在缓存歌词</h3>
          <div class="progress-info">
            <span class="collection-name">{{ cacheProgress.collectionName }}</span>
            <span class="progress-count">{{ cacheProgress.current }} / {{ cacheProgress.total }}</span>
          </div>
        </div>
        
        <div class="progress-content">
          <div class="progress-bar-container">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: (cacheProgress.current / cacheProgress.total * 100) + '%' }"
              ></div>
            </div>
            <div class="progress-percentage">
              {{ Math.round(cacheProgress.current / cacheProgress.total * 100) }}%
            </div>
          </div>
          
          <div class="current-song" v-if="cacheProgress.currentSong">
            <div class="song-icon">🎵</div>
            <div class="song-details">
              <div class="song-title">{{ cacheProgress.currentSong.title }}</div>
              <div class="song-artist">{{ cacheProgress.currentSong.artist }}</div>
            </div>
          </div>
        </div>
        
        <div class="progress-tip">
          <p>正在为您缓存歌词，请稍候...</p>
          <p class="tip-note">缓存完成后可离线查看歌词</p>
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
      },
      showShareModal: false,
      selectedCollection: null,
      qrCodeDataUrl: '',
      // 缓存相关状态
      cacheProgress: {
        show: false,
        current: 0,
        total: 0,
        currentSong: '',
        collectionName: ''
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

    shareCollection(collection) {
      this.selectedCollection = collection
      this.generateQRCode(collection)
      this.showShareModal = true
    },

    async generateQRCode(collection) {
      try {
        const QRCode = (await import('qrcode')).default
        
        // 创建分享数据
        const shareData = {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          songs: collection.songs,
          createdAt: collection.createdAt
        }
        
        // 生成分享URL
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}/share?data=${encodeURIComponent(JSON.stringify(shareData))}`
        
        // 生成二维码，优化样式和清晰度
        this.qrCodeDataUrl = await QRCode.toDataURL(shareUrl, {
          width: 300,
          height: 300,
          margin: 3,
          color: {
            dark: '#1976d2',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          rendererOpts: {
            quality: 0.92
          }
        })
      } catch (error) {
        console.error('生成二维码失败:', error)
        alert('生成二维码失败，请稍后重试')
      }
    },

    closeShareModal() {
      this.showShareModal = false
      this.selectedCollection = null
      this.qrCodeDataUrl = ''
    },

    copyShareLink() {
      if (this.selectedCollection) {
        const shareData = {
          id: this.selectedCollection.id,
          name: this.selectedCollection.name,
          description: this.selectedCollection.description,
          songs: this.selectedCollection.songs,
          createdAt: this.selectedCollection.createdAt
        }
        
        const baseUrl = window.location.origin
        const shareUrl = `${baseUrl}/share?data=${encodeURIComponent(JSON.stringify(shareData))}`
        
        // 检查是否支持现代剪贴板API
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert('分享链接已复制到剪贴板')
          }).catch(() => {
            this.fallbackCopyToClipboard(shareUrl)
          })
        } else {
          // 使用降级方案
          this.fallbackCopyToClipboard(shareUrl)
        }
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
          alert('分享链接已复制到剪贴板')
        } else {
          alert('复制失败，请手动复制链接')
        }
      } catch (err) {
        alert('复制失败，请手动复制链接')
      }
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
    },

    // 一键缓存合集歌词
    async cacheCollectionLyrics(collection) {
      if (!collection.songs || collection.songs.length === 0) {
        alert('该合集暂无歌曲')
        return
      }

      // 设置缓存状态
      this.$set(collection, 'caching', true)
      this.cacheProgress.show = true
      this.cacheProgress.current = 0
      this.cacheProgress.total = collection.songs.length
      this.cacheProgress.collectionName = collection.name

      let cachedCount = 0
      let skippedCount = 0
      let failedCount = 0

      try {
        for (let i = 0; i < collection.songs.length; i++) {
          const song = collection.songs[i]
          this.cacheProgress.current = i + 1
          this.cacheProgress.currentSong = `${song.title} - ${song.artist}`

          // 检查歌词是否已缓存
          const cacheKey = this.getLyricsCacheKey(song)
          const cached = this.getCachedLyrics(cacheKey)
          
          if (cached) {
            skippedCount++
            console.log(`跳过已缓存的歌曲: ${song.title}`)
            // 添加短暂延迟以显示进度
            await this.delay(200)
            continue
          }

          try {
            // 获取歌词
            const response = await this.fetchLyrics(song)
            if (response && response.code === 200 && response.raw_lyric) {
              // 缓存歌词
              this.saveLyricsToCache(song, response.raw_lyric)
              cachedCount++
              console.log(`成功缓存歌词: ${song.title}`)
            } else {
              failedCount++
              console.log(`获取歌词失败: ${song.title}`)
            }
          } catch (error) {
            failedCount++
            console.error(`缓存歌词失败: ${song.title}`, error)
          }

          // 添加延迟避免请求过于频繁
          await this.delay(500)
        }

        // 显示完成提示
        this.showCacheResult(cachedCount, skippedCount, failedCount, collection.name)

      } catch (error) {
        console.error('缓存过程出错:', error)
        alert('缓存过程中出现错误，请稍后重试')
      } finally {
        // 重置状态
        this.$set(collection, 'caching', false)
        this.cacheProgress.show = false
      }
    },

    // 获取歌词
    async fetchLyrics(song) {
      const { musicAPI } = await import('../api/music.js')
      const params = {
        id: song.id,
        source: song.source || 1,
        format: 1,
        include_translation: true
      }
      return await musicAPI.getLyrics(params)
    },

    // 获取歌词缓存键
    getLyricsCacheKey(song) {
      return `lyrics_${song.source || 1}_${song.id}`
    },

    // 获取缓存的歌词
    getCachedLyrics(cacheKey) {
      try {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
          const data = JSON.parse(cached)
          // 检查缓存是否过期（7天）
          const now = Date.now()
          if (now - data.timestamp < 7 * 24 * 60 * 60 * 1000) {
            return data
          } else {
            // 缓存过期，删除
            localStorage.removeItem(cacheKey)
          }
        }
      } catch (error) {
        console.error('读取歌词缓存失败:', error)
      }
      return null
    },

    // 保存歌词到缓存
    saveLyricsToCache(song, rawLyrics) {
      try {
        const cacheKey = this.getLyricsCacheKey(song)
        const data = {
          rawLyrics: rawLyrics,
          songInfo: {
            id: song.id,
            source: song.source || 1,
            title: song.title,
            artist: song.artist
          },
          timestamp: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(data))
        
        // 管理存储空间
        this.manageLyricsStorage()
      } catch (error) {
        console.error('保存歌词缓存失败:', error)
      }
    },

    // 管理歌词存储空间
    manageLyricsStorage() {
      try {
        const maxCacheItems = 100 // 最多缓存100首歌词
        const keys = Object.keys(localStorage).filter(key => key.startsWith('lyrics_'))
        
        if (keys.length > maxCacheItems) {
          // 获取所有缓存项的时间戳
          const cacheItems = keys.map(key => {
            try {
              const data = JSON.parse(localStorage.getItem(key))
              return { key, timestamp: data.timestamp || 0 }
            } catch {
              return { key, timestamp: 0 }
            }
          })
          
          // 按时间戳排序，删除最旧的项目
          cacheItems.sort((a, b) => a.timestamp - b.timestamp)
          const itemsToDelete = cacheItems.slice(0, keys.length - maxCacheItems)
          
          itemsToDelete.forEach(item => {
            localStorage.removeItem(item.key)
          })
          
          console.log(`清理了 ${itemsToDelete.length} 个旧的歌词缓存`)
        }
      } catch (error) {
        console.error('管理歌词存储失败:', error)
      }
    },

    // 显示缓存结果
    showCacheResult(cachedCount, skippedCount, failedCount, collectionName) {
      let message = `合集「${collectionName}」歌词缓存完成！\n\n`
      message += `✅ 新缓存: ${cachedCount} 首\n`
      message += `⏭️ 已跳过: ${skippedCount} 首\n`
      
      if (failedCount > 0) {
        message += `❌ 失败: ${failedCount} 首\n`
      }
      
      message += `\n总计处理: ${cachedCount + skippedCount + failedCount} 首歌曲`
      
      alert(message)
    },

    // 延迟函数
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms))
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

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* 分享按钮样式 */
.share-btn {
  background: #4caf50;
  color: white;
}

.share-btn:hover {
  background: #45a049;
}

/* 分享弹窗样式 */
.share-modal {
  max-width: 500px;
  padding: 0;
}

.share-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.share-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #333;
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
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #666;
}

.share-content {
  padding: 24px;
}

.collection-preview {
  text-align: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.collection-preview h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.collection-desc {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #666;
}

.song-count {
  margin: 0;
  font-size: 12px;
  color: #1976d2;
  font-weight: 500;
}

.qr-section {
  text-align: center;
  margin-bottom: 24px;
}

.qr-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  min-height: 300px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
}

.qr-code {
  max-width: 300px;
  max-height: 300px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  background: white;
  padding: 8px;
}

.qr-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 300px;
  height: 300px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #666;
  font-size: 14px;
}

.qr-loading .spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.qr-tip {
  margin: 0;
  font-size: 14px;
  color: #666;
  text-align: center;
  line-height: 1.5;
}

.share-actions {
  display: flex;
  justify-content: center;
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #1976d2;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.copy-btn:hover {
  background: #1565c0;
}

/* 缓存进度显示样式 */
.cache-progress-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.cache-progress-modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  width: 90%;
  max-width: 480px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.progress-header {
  text-align: center;
  margin-bottom: 24px;
}

.progress-header h3 {
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1976d2;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.collection-name {
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

.progress-count {
  font-size: 14px;
  color: #666;
  background: #f5f5f5;
  padding: 4px 12px;
  border-radius: 12px;
}

.progress-content {
  margin-bottom: 24px;
}

.progress-bar-container {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1976d2, #42a5f5);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 600;
  color: #1976d2;
  min-width: 40px;
  text-align: right;
}

.current-song {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #1976d2;
}

.song-icon {
  font-size: 24px;
  opacity: 0.8;
}

.song-details {
  flex: 1;
}

.song-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.song-artist {
  font-size: 14px;
  color: #666;
}

.progress-tip {
  text-align: center;
  color: #666;
}

.progress-tip p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.tip-note {
  font-size: 12px;
  opacity: 0.8;
}

.copy-btn:hover {
  background: #1565c0;
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