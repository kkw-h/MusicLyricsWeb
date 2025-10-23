<template>
  <div class="lyrics-page">
    <div class="lyrics-header">
      <button @click="goBack" class="back-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>
      <div class="song-info" v-if="currentSong">
        <h2 class="song-title">{{ currentSong.title }}</h2>
        <p class="song-artist">{{ currentSong.artist }}</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="loading-spinner"></div>
      <p>正在加载歌词...</p>
      <p class="loading-source" v-if="loadingFromCache">从本地缓存加载</p>
      <p class="loading-source" v-else>从网络获取</p>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">❌</div>
      <p>{{ error }}</p>
      <button @click="loadLyrics" class="retry-btn">重试</button>
    </div>

    <div v-else-if="parsedLyrics.length > 0" class="lyrics-container">
      <div class="lyrics-controls">
        <button 
          @click="togglePlay" 
          class="play-btn"
          :class="{ playing: isPlaying }"
        >
          <svg v-if="!isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
        
        <div class="time-display">
          <span class="current-time">{{ formatTime(currentTime) }}</span>
          <span class="separator">/</span>
          <span class="total-time">{{ formatTime(totalTime) }}</span>
        </div>
        
        <button @click="resetTime" class="control-btn reset-btn">重置</button>
      </div>

      <div class="lyrics-scroll-container" ref="lyricsContainer">
        <div class="lyrics-list">
          <div 
            v-for="(line, index) in parsedLyrics" 
            :key="index"
            class="lyrics-line"
            :class="{ active: index === currentLineIndex }"
            @click="seekToLine(index)"
          >
            <span class="lyric-text">{{ line.text }}</span>
            <span class="lyric-time">{{ formatTime(line.time) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <div class="empty-icon">🎵</div>
      <p>暂无歌词</p>
      <p class="empty-tip">该歌曲可能没有歌词信息</p>
    </div>
  </div>
</template>

<script>
import { musicAPI } from '../api/music.js'

export default {
  name: 'Lyrics',
  data() {
    return {
      currentSong: null,
      rawLyrics: '',
      parsedLyrics: [],
      loading: false,
      loadingFromCache: false,
      error: null,
      isPlaying: false,
      currentTime: 0,
      totalTime: 0,
      currentLineIndex: -1,
      timer: null
    }
  },
  mounted() {
    this.initializePage()
  },
  beforeUnmount() {
    this.clearTimer()
  },
  methods: {
    initializePage() {
      // 从路由参数获取歌曲信息
      const { id, source, title, artist } = this.$route.query
      console.log(id, source, title, artist)
      
      if (id) {
        this.currentSong = {
          id,
          source: source,
          title: title || '未知歌曲',
          artist: artist || '未知歌手'
        }
        this.loadLyrics()
      } else {
        // 如果没有路由参数，尝试加载上次播放的歌曲
        const lastPlayed = this.loadLastPlayedSong()
        if (lastPlayed) {
          console.log('加载上次播放的歌曲:', lastPlayed)
          this.currentSong = {
            id: lastPlayed.id,
            source: lastPlayed.source,
            title: lastPlayed.title,
            artist: lastPlayed.artist
          }
          this.loadLyrics()
        } else {
          this.error = '缺少歌曲信息'
        }
      }
    },

    async loadLyrics() {
      if (!this.currentSong) return

      this.loading = true
      this.error = null

      try {
        // 首先尝试从本地存储加载歌词
        this.loadingFromCache = true
        const cachedLyrics = this.getCachedLyrics()
        if (cachedLyrics) {
          console.log('从本地缓存加载歌词')
          this.rawLyrics = cachedLyrics.rawLyrics
          this.parseLyrics()
          this.loading = false
          this.loadingFromCache = false
          return
        }

        // 本地没有缓存，从API获取
        this.loadingFromCache = false
        console.log('从API获取歌词')
        const params = {
          id: this.currentSong.id,
          source: this.currentSong.source,
          format: 1, // LRC格式
          include_translation: true
        }

        const response = await musicAPI.getLyrics(params)
        
        // 检查API响应是否成功
        if (response.code !== 200) {
          console.log(response)
          throw new Error(response.message || '获取歌词失败')
        }
        
        this.rawLyrics = response.raw_lyric || response.data?.raw_lyric || ''
        
        // 只有成功获取到歌词时才进行缓存
        if (this.rawLyrics) {
          this.saveLyricsToCache()
        }
        
        this.parseLyrics()
      } catch (error) {
        console.error('获取歌词失败:', error)
        this.error = '获取歌词失败，请稍后重试'
      } finally {
        this.loading = false
        this.loadingFromCache = false
      }
    },

    parseLyrics() {
      if (!this.rawLyrics) {
        this.parsedLyrics = []
        return
      }

      const lines = this.rawLyrics.split('\n')
      const parsed = []
      let maxTime = 0

      lines.forEach(line => {
        const timeMatch = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
        
        if (timeMatch) {
          const minutes = parseInt(timeMatch[1])
          const seconds = parseInt(timeMatch[2])
          const milliseconds = parseInt(timeMatch[3].padEnd(3, '0'))
          const time = minutes * 60 + seconds + milliseconds / 1000
          const text = timeMatch[4].trim()
          
          if (text) {
            parsed.push({ time, text })
            maxTime = Math.max(maxTime, time)
          }
        } else if (line.trim() && !line.startsWith('[')) {
          // 没有时间标记的歌词行
          parsed.push({ time: null, text: line.trim() })
        }
      })

      // 按时间排序
      parsed.sort((a, b) => {
        if (a.time === null) return 1
        if (b.time === null) return -1
        return a.time - b.time
      })

      this.parsedLyrics = parsed
      this.totalTime = maxTime + 10 // 添加一些缓冲时间
    },

    togglePlay() {
      if (this.isPlaying) {
        this.pause()
      } else {
        this.play()
      }
    },

    play() {
      this.isPlaying = true
      this.timer = setInterval(() => {
        this.currentTime += 0.1
        this.updateCurrentLine()
        
        if (this.currentTime >= this.totalTime) {
          this.pause()
        }
      }, 100)
    },

    pause() {
      this.isPlaying = false
      this.clearTimer()
    },

    resetTime() {
      this.pause()
      this.currentTime = 0
      this.currentLineIndex = -1
    },

    clearTimer() {
      if (this.timer) {
        clearInterval(this.timer)
        this.timer = null
      }
    },

    updateCurrentLine() {
      let newIndex = -1
      
      for (let i = 0; i < this.parsedLyrics.length; i++) {
        const line = this.parsedLyrics[i]
        if (line.time !== null && line.time <= this.currentTime) {
          newIndex = i
        } else {
          break
        }
      }
      
      if (newIndex !== this.currentLineIndex) {
        this.currentLineIndex = newIndex
        this.scrollToCurrentLine()
      }
    },

    scrollToCurrentLine() {
      this.$nextTick(() => {
        if (this.currentLineIndex >= 0) {
          const container = this.$refs.lyricsContainer
          const lyricsLines = container?.querySelectorAll('.lyrics-line')
          const currentElement = lyricsLines?.[this.currentLineIndex]
          
          if (container && currentElement) {
            const containerHeight = container.clientHeight
            const elementTop = currentElement.offsetTop
            const elementHeight = currentElement.clientHeight
            
            // 计算滚动位置，让当前歌词行显示在容器中央
            const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2
            
            container.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            })
          }
        }
      })
    },

    seekToTime(time, index) {
      if (time !== null) {
        this.currentTime = time;
        this.currentLineIndex = index;
        this.scrollToCurrentLine();
      }
    },

    seekToLine(index) {
      const line = this.parsedLyrics[index];
      if (line && line.time !== null) {
        this.seekToTime(line.time, index);
      }
    },

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    goBack() {
      this.$router.go(-1)
    },

    // 本地存储相关方法
    getCachedLyrics() {
      try {
        const cacheKey = this.getLyricsCacheKey()
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

    saveLyricsToCache() {
      try {
        const cacheKey = this.getLyricsCacheKey()
        const data = {
          rawLyrics: this.rawLyrics,
          songInfo: { 
            id: this.currentSong.id,
            source: this.currentSong.source,
            title: this.currentSong.title,
            artist: this.currentSong.artist
          },
          timestamp: Date.now()
        }
        localStorage.setItem(cacheKey, JSON.stringify(data))
        
        // 保存最后播放的歌曲信息
        this.saveLastPlayedSong()
        
        // 管理存储空间
        this.manageLyricsStorage()
      } catch (error) {
        console.error('保存歌词缓存失败:', error)
      }
    },

    getLyricsCacheKey() {
      return `lyrics_${this.currentSong.source}_${this.currentSong.id}`
    },

    saveLastPlayedSong() {
      try {
        const lastPlayed = {
          id: this.currentSong.id,
          source: this.currentSong.source,
          title: this.currentSong.title,
          artist: this.currentSong.artist,
          timestamp: Date.now()
        }
        localStorage.setItem('lastPlayedSong', JSON.stringify(lastPlayed))
      } catch (error) {
        console.error('保存最后播放歌曲失败:', error)
      }
    },

    loadLastPlayedSong() {
      try {
        const lastPlayed = localStorage.getItem('lastPlayedSong')
        if (lastPlayed) {
          return JSON.parse(lastPlayed)
        }
      } catch (error) {
        console.error('读取最后播放歌曲失败:', error)
      }
      return null
    },

    manageLyricsStorage() {
      try {
        const maxCacheItems = 50 // 最多缓存50首歌词
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
    }
  }
}
</script>

<style scoped>
.lyrics-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  color: #333;
}

.lyrics-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  position: relative;
}

.lyrics-header::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, #1976d2, transparent);
  opacity: 0.3;
}

.back-btn {
  background: #e0e0e0;
  border: none;
  color: #333;
  padding: 8px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.back-btn:hover {
  background: #d0d0d0;
}

.song-info {
  flex: 1;
}

.song-title {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1976d2;
}

.song-artist {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
  color: #666;
}

.loading-state,
.error-state,
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e0e0e0;
  border-top: 3px solid #1976d2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

.loading-source {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  opacity: 0.8;
}

.error-icon,
.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.retry-btn {
  background: #e0e0e0;
  border: 1px solid #d0d0d0;
  color: #333;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 15px;
}

.lyrics-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lyrics-controls {
  padding: 15px 20px;
  display: flex;
  align-items: center;
  gap: 15px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.play-btn {
  background: #1976d2;
  border: none;
  color: white;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn:hover {
  background: #1565c0;
  transform: scale(1.05);
}

.play-btn.playing {
  background: #1565c0;
}

.time-display {
  flex: 1;
  text-align: center;
  font-family: monospace;
  font-size: 14px;
}

.separator {
  margin: 0 5px;
  opacity: 0.6;
}

.reset-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}

.lyrics-scroll-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  scroll-behavior: smooth;
}

.lyrics-list {
  max-width: 600px;
  margin: 0 auto;
}

.lyrics-line {
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  line-height: 1.4;
  color: #666;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lyrics-line.active {
  color: #1976d2;
  font-weight: 600;
  font-size: 18px;
}

.lyrics-line:hover {
  color: #1976d2;
}

.reset-btn {
  background: #ff5722 !important;
  border: 1px solid #e64a19 !important;
}

.reset-btn:hover {
  background: #e64a19 !important;
}

.lyric-time {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
  flex-shrink: 0;
}

.lyric-text {
  flex: 1;
  font-size: 16px;
  line-height: 1.5;
}

.lyric-time {
  font-size: 12px;
  opacity: 0.6;
  font-family: monospace;
  margin-left: 10px;
}

.empty-tip {
  font-size: 14px;
  opacity: 0.7;
  margin-top: 8px;
}

@media (max-width: 480px) {
  .lyrics-header {
    padding: 15px;
  }
  
  .song-title {
    font-size: 16px;
  }
  
  .lyrics-controls {
    padding: 12px 15px;
  }
  
  .lyrics-scroll-container {
    padding: 15px;
  }
  
  .lyric-line {
    padding: 10px 12px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .lyric-text {
    font-size: 15px;
  }
  
  .lyric-time {
    margin-left: 0;
    align-self: flex-end;
  }
}

/* 滚动条样式 */
.lyrics-scroll-container::-webkit-scrollbar {
  width: 4px;
}

.lyrics-scroll-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
}

.lyrics-scroll-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.lyrics-scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>