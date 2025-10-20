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
        
        <button @click="resetTime" class="reset-btn">重置</button>
      </div>

      <div class="lyrics-scroll-container" ref="lyricsContainer">
        <div class="lyrics-list">
          <div 
            v-for="(line, index) in parsedLyrics" 
            :key="index"
            class="lyric-line"
            :class="{ 
              active: index === currentLineIndex,
              clickable: line.time !== null 
            }"
            @click="seekToTime(line.time, index)"
            :ref="el => { if (el) lyricRefs[index] = el }"
          >
            <span class="lyric-text">{{ line.text }}</span>
            <span v-if="line.time !== null" class="lyric-time">
              {{ formatTime(line.time) }}
            </span>
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
      error: null,
      isPlaying: false,
      currentTime: 0,
      totalTime: 0,
      currentLineIndex: -1,
      timer: null,
      lyricRefs: {}
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
        this.error = '缺少歌曲信息'
      }
    },

    async loadLyrics() {
      if (!this.currentSong) return

      this.loading = true
      this.error = null

      try {
        const params = {
          id: this.currentSong.id,
          source: this.currentSong.source,
          format: 1, // LRC格式
          include_translation: true
        }

        const response = await musicAPI.getLyrics(params)
        this.rawLyrics = response.raw_lyric || response.data?.raw_lyric || ''
        this.parseLyrics()
      } catch (error) {
        console.error('获取歌词失败:', error)
        this.error = '获取歌词失败，请稍后重试'
      } finally {
        this.loading = false
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
      if (this.currentLineIndex >= 0 && this.lyricRefs[this.currentLineIndex]) {
        const container = this.$refs.lyricsContainer
        const element = this.lyricRefs[this.currentLineIndex]
        
        if (container && element) {
          const containerHeight = container.clientHeight
          const elementTop = element.offsetTop
          const elementHeight = element.clientHeight
          
          const scrollTop = elementTop - containerHeight / 2 + elementHeight / 2
          
          container.scrollTo({
            top: Math.max(0, scrollTop),
            behavior: 'smooth'
          })
        }
      }
    },

    seekToTime(time, index) {
      if (time !== null) {
        this.currentTime = time
        this.currentLineIndex = index
        this.scrollToCurrentLine()
      }
    },

    formatTime(seconds) {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    },

    goBack() {
      this.$router.go(-1)
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
}

.song-artist {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
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

.lyric-line {
  padding: 8px 0;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
  line-height: 1.4;
  color: #666;
}

.lyric-line.active {
  color: #1976d2;
  font-weight: 600;
  font-size: 18px;
}

.lyric-line:hover {
  color: #1976d2;
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