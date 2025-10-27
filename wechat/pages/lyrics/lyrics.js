import { musicAPI } from '../../utils/api'

const app = getApp()

Page({
  data: {
    currentSong: null,
    rawLyrics: '',
    parsedLyrics: [],
    loading: false,
    loadingFromCache: false,
    error: '',
    isPlaying: false,
    currentTime: 0,
    totalTime: 0,
    currentLineIndex: -1,
    currentScrollId: '',
    formattedCurrentTime: '00:00',
    formattedTotalTime: '00:00'
  },

  onLoad(options) {
    this.initializePage(options)
  },

  onHide() {
    this.clearTimer()
  },

  onUnload() {
    this.clearTimer()
  },

  initializePage(options = {}) {
    console.log('初始化页面，URL参数:', options)
    
    // 优先从本地存储获取歌曲数据
    let currentPlayingSong = null
    try {
      currentPlayingSong = wx.getStorageSync('currentPlayingSong')
      console.log('从本地存储获取的歌曲数据:', currentPlayingSong)
      
      // 验证数据有效性（检查时间戳，避免使用过期数据）
      if (currentPlayingSong && currentPlayingSong.timestamp) {
        const now = Date.now()
        const dataAge = now - currentPlayingSong.timestamp
        // 如果数据超过1小时，认为过期
        if (dataAge > 60 * 60 * 1000) {
          console.log('本地存储的歌曲数据已过期，清除')
          wx.removeStorageSync('currentPlayingSong')
          currentPlayingSong = null
        }
      }
    } catch (error) {
      console.error('获取本地存储歌曲数据失败:', error)
      currentPlayingSong = null
    }

    // 如果本地存储有有效的歌曲数据，优先使用
    if (currentPlayingSong && currentPlayingSong.id) {
      const song = {
        id: currentPlayingSong.id,
        source: Number(currentPlayingSong.source) || 1,
        title: currentPlayingSong.title || '未知歌曲',
        artist: currentPlayingSong.artist || '未知歌手',
        album: currentPlayingSong.album || '',
        platform_name: currentPlayingSong.platform_name || ''
      }
      console.log('使用本地存储的歌曲数据:', song)
      this.setData({ currentSong: song })
      this.loadLyrics()
      
      // 清除本地存储的临时数据，避免下次误用
      wx.removeStorageSync('currentPlayingSong')
      return
    }

    // 如果本地存储没有数据，尝试使用URL参数
    const { id, source, title, artist } = options
    if (id) {
      const song = {
        id,
        source: source !== undefined ? Number(source) : 1,
        title: title || '未知歌曲',
        artist: artist || '未知歌手'
      }
      console.log('使用URL参数的歌曲数据:', song)
      this.setData({ currentSong: song })
      this.loadLyrics()
    } else if (app && app.globalData && app.globalData.lastPlayedSong) {
      console.log('使用全局数据的歌曲信息')
      this.setData({ currentSong: app.globalData.lastPlayedSong })
      this.loadLyrics()
    } else {
      const lastPlayed = this.loadLastPlayedSong()
      if (lastPlayed) {
        console.log('使用上次播放的歌曲信息')
        this.setData({ currentSong: lastPlayed })
        this.loadLyrics()
      } else {
        console.error('没有找到任何歌曲信息')
        this.setData({ error: '缺少歌曲信息' })
      }
    }
  },

  async loadLyrics() {
    const song = this.data.currentSong
    if (!song) return

    this.setData({
      loading: true,
      error: '',
      loadingFromCache: true
    })

    try {
      const cacheKey = this.getLyricsCacheKey(song)
      const cached = this.getCachedLyrics(cacheKey)
      if (cached) {
        this.processLyrics(cached.rawLyrics)
        this.setData({
          loading: false,
          loadingFromCache: false
        })
        return
      }

      this.setData({ loadingFromCache: false })

      const response = await musicAPI.getLyrics({
        id: song.id,
        source: song.source
      })

      if (response.code !== 200) {
        throw new Error(response.message || '获取歌词失败')
      }

      const rawLyrics =
        response?.data?.lyric?.lyric ||
        ''

      console.log('API返回的歌词数据:', {
        lyric: response?.data?.lyric.lyric
      })

      if (!rawLyrics || typeof rawLyrics !== 'string') {
        this.setData({
          parsedLyrics: [],
          rawLyrics: '',
          totalTime: 0,
          formattedTotalTime: '00:00'
        })
      } else {
        this.saveLyricsToCache(cacheKey, rawLyrics, song)
        this.processLyrics(rawLyrics)
      }
    } catch (error) {
      console.error('获取歌词失败', error)
      this.setData({
        error: '获取歌词失败，请稍后重试'
      })
    } finally {
      this.setData({
        loading: false,
        loadingFromCache: false
      })
    }
  },

  processLyrics(rawLyrics) {
    
    // 确保rawLyrics是字符串类型
    if (typeof rawLyrics !== 'string') {
      console.error('rawLyrics不是字符串类型:', rawLyrics)
      rawLyrics = String(rawLyrics || '')
    }
    
    const lines = rawLyrics.split('\n')
    const parsed = []
    let maxTime = 0

    lines.forEach((line) => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
      if (match) {
        const minutes = parseInt(match[1], 10)
        const seconds = parseInt(match[2], 10)
        const milliseconds = parseInt(match[3].padEnd(3, '0'), 10)
        const time = minutes * 60 + seconds + milliseconds / 1000
        const text = match[4].trim()
        if (text) {
          parsed.push({
            time,
            text,
            formattedTime: this.formatTime(time)
          })
          if (time > maxTime) {
            maxTime = time
          }
        }
      } else if (line.trim() && !line.startsWith('[')) {
        parsed.push({
          time: null,
          text: line.trim(),
          formattedTime: ''
        })
      }
    })

    parsed.sort((a, b) => {
      if (a.time === null) return 1
      if (b.time === null) return -1
      return a.time - b.time
    })

    const totalTime = maxTime + 10

    this.setData({
      rawLyrics,
      parsedLyrics: parsed,
      totalTime,
      formattedCurrentTime: this.formatTime(0),
      formattedTotalTime: this.formatTime(totalTime),
      currentTime: 0,
      currentLineIndex: -1,
      currentScrollId: ''
    })
  },

  togglePlay() {
    if (this.data.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  },

  play() {
    if (this.data.parsedLyrics.length === 0) return
    this.setData({ isPlaying: true })

    this.timer = setInterval(() => {
      const newTime = this.data.currentTime + 0.1
      if (newTime >= this.data.totalTime) {
        this.pause()
        return
      }
      this.setData({
        currentTime: newTime,
        formattedCurrentTime: this.formatTime(newTime)
      })
      this.updateCurrentLine(newTime)
    }, 100)
  },

  pause() {
    this.setData({ isPlaying: false })
    this.clearTimer()
  },

  resetTime() {
    this.pause()
    this.setData({
      currentTime: 0,
      formattedCurrentTime: this.formatTime(0),
      currentLineIndex: -1,
      currentScrollId: ''
    })
  },

  updateCurrentLine(time) {
    const lyrics = this.data.parsedLyrics
    let newIndex = -1
    for (let i = 0; i < lyrics.length; i++) {
      const line = lyrics[i]
      if (line.time !== null && line.time <= time) {
        newIndex = i
      } else {
        break
      }
    }

    if (newIndex !== this.data.currentLineIndex) {
      this.setData({
        currentLineIndex: newIndex,
        currentScrollId: newIndex >= 0 ? `line-${newIndex}` : ''
      })
    }
  },

  seekToLine(event) {
    const { index, time } = event.currentTarget.dataset
    if (time === null || time === undefined) return

    this.pause()
    this.setData({
      currentTime: Number(time),
      formattedCurrentTime: this.formatTime(Number(time)),
      currentLineIndex: index,
      currentScrollId: `line-${index}`
    })
  },

  getLyricsCacheKey(song) {
    return `lyrics_${song.source || 1}_${song.id}`
  },

  getCachedLyrics(cacheKey) {
    try {
      const cached = wx.getStorageSync(cacheKey)
      if (cached) {
        const now = Date.now()
        if (cached.timestamp && now - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
          return cached
        }
        wx.removeStorageSync(cacheKey)
      }
    } catch (error) {
      console.warn('读取歌词缓存失败', error)
    }
    return null
  },

  saveLyricsToCache(cacheKey, rawLyrics, song) {
    const data = {
      rawLyrics,
      songInfo: song,
      timestamp: Date.now()
    }

    try {
      wx.setStorageSync(cacheKey, data)
      this.saveLastPlayedSong(song)
      this.manageLyricsStorage()
      if (app && typeof app.setLastPlayedSong === 'function') {
        app.setLastPlayedSong(song)
      }
    } catch (error) {
      console.warn('保存歌词缓存失败', error)
    }
  },

  saveLastPlayedSong(song) {
    try {
      wx.setStorageSync('lastPlayedSong', song)
    } catch (error) {
      console.warn('保存最后播放歌曲失败', error)
    }
  },

  loadLastPlayedSong() {
    try {
      return wx.getStorageSync('lastPlayedSong') || null
    } catch (error) {
      console.warn('读取最后播放歌曲失败', error)
      return null
    }
  },

  manageLyricsStorage() {
    try {
      const info = wx.getStorageInfoSync()
      const keys = (info.keys || []).filter((key) => key.startsWith('lyrics_'))
      const maxItems = 50
      if (keys.length <= maxItems) return

      const items = keys
        .map((key) => {
          try {
            const data = wx.getStorageSync(key)
            return { key, timestamp: data?.timestamp || 0 }
          } catch (error) {
            return { key, timestamp: 0 }
          }
        })
        .sort((a, b) => a.timestamp - b.timestamp)

      const toDelete = items.slice(0, keys.length - maxItems)
      toDelete.forEach((item) => wx.removeStorageSync(item.key))
    } catch (error) {
      console.warn('管理歌词缓存失败', error)
    }
  },

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60)
    const seconds = Math.floor(timeInSeconds % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    })
  }
})
