import { musicAPI } from '../../utils/api'
import { getCollections, setCollections } from '../../utils/storage'
import { generateQRCodeDataURL } from '../../utils/qrcode'

const app = getApp()

// 平台信息映射
const PLATFORMS = {
  0: { name: 'netease', display_name: '网易云音乐' },
  1: { name: 'qqmusic', display_name: 'QQ音乐' }
}

Page({
  data: {
    collections: [],
    showModal: false,
    editingCollectionId: null,
    editingCollectionIndex: -1,
    modalForm: {
      name: '',
      description: ''
    },
    canSaveCollection: false,
    showShareModal: false,
    selectedCollection: null,
    qrCodeImage: '',
    cacheProgress: {
      show: false,
      current: 0,
      total: 0,
      percentage: 0,
      collectionName: '',
      currentSong: null
    }
  },

  onLoad() {
    this.loadCollections()
  },

  onShow() {
    console.log('页面显示，尝试加载合集数据')
    this.loadCollections()
  },

  loadCollections() {
    let collections = []
    if (app && app.globalData && Array.isArray(app.globalData.collections) && app.globalData.collections.length) {
      collections = app.globalData.collections
    } else {
      collections = getCollections()
    }

    const normalized = (collections || []).map((collection) => ({
      ...collection,
      expanded: collection.expanded || false,
      caching: false,
      formattedDate: this.formatDate(collection.createdAt || new Date().toISOString())
    }))

    this.setData({
      collections: normalized
    })
  },

  persistCollections(collections) {
    this.setData({ collections })
    setCollections(collections.map(({ caching, formattedDate, ...rest }) => rest))
    if (app && typeof app.updateCollections === 'function') {
      app.updateCollections(collections.map(({ caching, formattedDate, ...rest }) => rest))
    }
  },

  toggleCollection(event) {
    const { index } = event.currentTarget.dataset
    if (index === undefined) return

    const key = `collections[${index}].expanded`
    const expanded = this.data.collections[index].expanded
    this.setData({ [key]: !expanded })
  },

  openCreateModal() {
    this.setData({
      showModal: true,
      editingCollectionId: null,
      editingCollectionIndex: -1,
      modalForm: {
        name: '',
        description: ''
      },
      canSaveCollection: false
    })
  },

  editCollection(event) {
    const { index } = event.currentTarget.dataset
    const collection = this.data.collections[index]
    if (!collection) return

    this.setData({
      showModal: true,
      editingCollectionId: collection.id,
      editingCollectionIndex: index,
      modalForm: {
        name: collection.name,
        description: collection.description || ''
      },
      canSaveCollection: !!collection.name
    })
  },

  onModalNameChange(event) {
    const value = event.detail.value || ''
    this.setData({
      modalForm: {
        ...this.data.modalForm,
        name: value
      },
      canSaveCollection: value.trim().length > 0
    })
  },

  onModalDescriptionChange(event) {
    const value = event.detail.value || ''
    this.setData({
      modalForm: {
        ...this.data.modalForm,
        description: value
      }
    })
  },

  closeModal() {
    this.setData({
      showModal: false,
      editingCollectionId: null,
      editingCollectionIndex: -1,
      modalForm: {
        name: '',
        description: ''
      },
      canSaveCollection: false
    })
  },

  saveCollection() {
    if (!this.data.canSaveCollection) return

    const name = this.data.modalForm.name.trim()
    const description = this.data.modalForm.description.trim()
    const collections = this.data.collections.map((collection) => ({ ...collection }))

    if (this.data.editingCollectionId) {
      const index = this.data.editingCollectionIndex
      if (index < 0) return

      collections[index].name = name
      collections[index].description = description
      this.persistCollections(collections)
    } else {
      const newCollection = {
        id: Date.now(),
        name,
        description,
        createdAt: new Date().toISOString(),
        songs: [],
        expanded: false,
        caching: false,
        formattedDate: this.formatDate(new Date().toISOString())
      }
      collections.unshift(newCollection)
      this.persistCollections(collections)
    }

    this.closeModal()
  },

  deleteCollection(event) {
    const { index } = event.currentTarget.dataset
    const collection = this.data.collections[index]
    if (!collection) return

    wx.showModal({
      title: '删除合集',
      content: `确定要删除合集「${collection.name}」吗？此操作不可恢复。`,
      confirmColor: '#d32f2f',
      success: (res) => {
        if (res.confirm) {
          const collections = this.data.collections.filter((_, idx) => idx !== index)
          this.persistCollections(collections)
        }
      }
    })
  },

  goToSearch() {
    wx.switchTab({
      url: '/pages/search/search'
    })
  },

  removeSong(event) {
    const { collection: collectionIndex, song: songIndex } = event.currentTarget.dataset
    const collections = this.data.collections.map((collection) => ({ ...collection, songs: [...(collection.songs || [])] }))
    const targetCollection = collections[collectionIndex]
    if (!targetCollection) return

    targetCollection.songs.splice(songIndex, 1)
    collections[collectionIndex] = targetCollection
    this.persistCollections(collections)
  },

  viewSongLyrics(event) {
    const { collection: collectionIndex, song: songIndex } = event.currentTarget.dataset
    const collection = this.data.collections[collectionIndex]
    if (!collection) {
      console.error('未找到合集信息', { collectionIndex, collections: this.data.collections })
      wx.showToast({
        title: '合集信息错误',
        icon: 'error',
        duration: 2000
      })
      return
    }
    
    const song = collection.songs[songIndex]
    if (!song) {
      console.error('未找到歌曲信息', { songIndex, songs: collection.songs })
      wx.showToast({
        title: '歌曲信息错误',
        icon: 'error',
        duration: 2000
      })
      return
    }

    // 确保必要的参数存在
    if (!song.id) {
      console.error('歌曲ID缺失', song)
      wx.showToast({
        title: '歌曲ID缺失',
        icon: 'error',
        duration: 2000
      })
      return
    }

    console.log('跳转到歌词页面', {
      song,
      source: song.source
    })

    // 将歌曲数据保存到本地存储
    const platform = PLATFORMS[song.source] || PLATFORMS[1]
    const songData = {
      id: song.id,
      source: song.source,
      title: song.title || '',
      artist: song.artist || '',
      album: song.album || '',
      platform_name: platform.display_name,
      timestamp: Date.now() // 添加时间戳用于数据有效性验证
    }

    try {
      wx.setStorageSync('currentPlayingSong', songData)
      console.log('歌曲数据已保存到本地存储', songData)
    } catch (error) {
      console.error('保存歌曲数据失败', error)
      wx.showToast({
        title: '数据保存失败',
        icon: 'error',
        duration: 2000
      })
      return
    }
    
    // 使用switchTab跳转到歌词页面
    wx.switchTab({
      url: '/pages/lyrics/lyrics',
      success: () => {
        console.log('成功跳转到歌词页面')
      },
      fail: (error) => {
        console.error('跳转失败', error)
        wx.showToast({
          title: '跳转失败',
          icon: 'error',
          duration: 2000
        })
      }
    })
  },

  shareCollection(event) {
    const { index } = event.currentTarget.dataset
    const collection = this.data.collections[index]
    if (!collection) return

    this.setData({
      showShareModal: true,
      selectedCollection: collection,
      qrCodeImage: ''
    })

    this.generateQRCode(collection)
  },

  async generateQRCode(collection) {
    try {
      const shareData = {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        songs: collection.songs || [],
        createdAt: collection.createdAt
      }
      const payload = encodeURIComponent(JSON.stringify(shareData))
      const path = `/pages/share/share?data=${payload}`
      const dataURL = await generateQRCodeDataURL(path, { size: 300 })
      this.setData({ qrCodeImage: dataURL })
    } catch (error) {
      console.error('生成二维码失败', error)
      wx.showToast({
        title: '生成二维码失败',
        icon: 'none'
      })
    }
  },

  copyShareLink() {
    if (!this.data.selectedCollection) return
    const payload = encodeURIComponent(JSON.stringify({
      id: this.data.selectedCollection.id,
      name: this.data.selectedCollection.name,
      description: this.data.selectedCollection.description,
      songs: this.data.selectedCollection.songs || [],
      createdAt: this.data.selectedCollection.createdAt
    }))
    const link = `/pages/share/share?data=${payload}`

    wx.setClipboardData({
      data: link,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  closeShareModal() {
    this.setData({
      showShareModal: false,
      selectedCollection: null,
      qrCodeImage: ''
    })
  },

  async cacheCollectionLyrics(event) {
    const { index } = event.currentTarget.dataset
    const collection = this.data.collections[index]
    if (!collection || !collection.songs || collection.songs.length === 0) {
      wx.showToast({
        title: '该合集暂无歌曲',
        icon: 'none'
      })
      return
    }

    this.setData({
      [`collections[${index}].caching`]: true,
      'cacheProgress.show': true,
      'cacheProgress.current': 0,
      'cacheProgress.total': collection.songs.length,
      'cacheProgress.percentage': 0,
      'cacheProgress.collectionName': collection.name,
      'cacheProgress.currentSong': null
    })

    let cachedCount = 0
    let skippedCount = 0
    let failedCount = 0

    try {
      for (let i = 0; i < collection.songs.length; i++) {
        const song = collection.songs[i]
        const songInfo = {
          id: song.id,
          source: song.source || 1,
          title: song.title || song.name,
          artist: song.artist
        }

        this.setData({
          'cacheProgress.current': i + 1,
          'cacheProgress.percentage': Math.round(((i + 1) / collection.songs.length) * 100),
          'cacheProgress.currentSong': songInfo
        })

        const cacheKey = this.getLyricsCacheKey(songInfo)
        const cached = this.getCachedLyrics(cacheKey)
        if (cached) {
          skippedCount += 1
          await this.delay(200)
          continue
        }

        try {
          const response = await musicAPI.getLyrics({
            id: songInfo.id,
            source: songInfo.source
          })

          const rawLyrics =
            response?.data?.lyric ||
            response?.data?.lrc ||
            response?.data?.raw_lyric ||
            response?.data?.rawLyrics ||
            ''

          if (response.code === 200 && rawLyrics) {
            this.saveLyricsToCache(songInfo, rawLyrics)
            cachedCount += 1
          } else {
            failedCount += 1
          }
        } catch (error) {
          console.error('缓存歌词失败', error)
          failedCount += 1
        }

        await this.delay(400)
      }

      const total = cachedCount + skippedCount + failedCount
      wx.showModal({
        title: '缓存完成',
        content: `合集「${collection.name}」歌词缓存完成。\n\n新缓存：${cachedCount} 首\n已跳过：${skippedCount} 首\n失败：${failedCount} 首\n\n总计：${total} 首歌曲`,
        showCancel: false
      })
    } finally {
      this.setData({
        [`collections[${index}].caching`]: false,
        'cacheProgress.show': false
      })
    }
  },

  getLyricsCacheKey(song) {
    if (!song || !song.id) return ''
    return `lyrics_${song.source || 1}_${song.id}`
  },

  getCachedLyrics(cacheKey) {
    if (!cacheKey) return null
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

  saveLyricsToCache(song, rawLyrics) {
    const cacheKey = this.getLyricsCacheKey(song)
    if (!cacheKey) return
    try {
      const data = {
        rawLyrics,
        songInfo: song,
        timestamp: Date.now()
      }
      wx.setStorageSync(cacheKey, data)
      this.manageLyricsStorage()
    } catch (error) {
      console.warn('保存歌词缓存失败', error)
    }
  },

  manageLyricsStorage() {
    try {
      const storageInfo = wx.getStorageInfoSync()
      const keys = (storageInfo.keys || []).filter((key) => key.startsWith('lyrics_'))
      const maxCacheItems = 100
      if (keys.length <= maxCacheItems) {
        return
      }
      const cacheItems = keys
        .map((key) => {
          try {
            const data = wx.getStorageSync(key)
            return {
              key,
              timestamp: data?.timestamp || 0
            }
          } catch (error) {
            return { key, timestamp: 0 }
          }
        })
        .sort((a, b) => a.timestamp - b.timestamp)

      const toRemove = cacheItems.slice(0, keys.length - maxCacheItems)
      toRemove.forEach((item) => wx.removeStorageSync(item.key))
    } catch (error) {
      console.warn('管理歌词缓存失败', error)
    }
  },

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  },

  formatDate(dateString) {
    try {
      const date = new Date(dateString)
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }
      return date.toLocaleDateString('zh-CN', options)
    } catch (error) {
      return dateString
    }
  },

  noop() {}
})
