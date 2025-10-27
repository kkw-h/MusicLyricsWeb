import { musicAPI } from '../../utils/api'
import { getCollections, setCollections } from '../../utils/storage'

const app = getApp()

Page({
  data: {
    searchQuery: '',
    canSearch: false,
    selectedPlatform: 1,
    searchResults: [],
    loading: false,
    hasSearched: false,
    error: '',
    collections: [],
    showCollectionModal: false,
    showCreateModal: false,
    selectedSong: null,
    newCollectionName: '',
    newCollectionDescription: '',
    canCreateCollection: false,
    showSuccessToast: false,
    showErrorToast: false,
    successMessage: '',
    errorMessage: ''
  },

  onLoad() {
    this.loadCollections()
  },

  onShow() {
    this.loadCollections()
  },

  onHide() {
    this.clearToastTimers()
  },

  onUnload() {
    this.clearToastTimers()
  },

  onQueryChange(event) {
    const value = event.detail.value || ''
    this.setData({
      searchQuery: value,
      canSearch: value.trim().length > 0
    })
  },

  onCollectionNameChange(event) {
    const value = event.detail.value || ''
    this.setData({
      newCollectionName: value,
      canCreateCollection: value.trim().length > 0
    })
  },

  onCollectionDescriptionChange(event) {
    this.setData({
      newCollectionDescription: event.detail.value || ''
    })
  },

  onPlatformChange(event) {
    const value = Number(event.detail.value)
    this.setData({
      selectedPlatform: value
    })
  },

  async handleSearch() {
    if (this.data.loading || !this.data.canSearch) {
      return
    }

    this.setData({
      loading: true,
      error: '',
      hasSearched: true
    })

    try {
      const response = await musicAPI.searchSongs({
        name: this.data.searchQuery,
        source: this.data.selectedPlatform,
        limit: 20
      })

      if (response.code === 200 && response.data && response.data.songs) {
        console.log('搜索成功', response.data.songs)
        this.setData({
          searchResults: response.data.songs
        })
      } else {
        this.setData({
          searchResults: [],
          error: response.message || '搜索失败，请稍后重试'
        })
      }
    } catch (error) {
      console.error('搜索失败', error)
      this.setData({
        searchResults: [],
        error: '搜索失败，请检查网络连接或稍后重试'
      })
    } finally {
      this.setData({
        loading: false
      })
    }
  },

  selectSong(event) {
    const { index } = event.currentTarget.dataset
    const song = this.data.searchResults[index]
    if (song) {
      console.log('选中歌曲', song)
    }
  },

  viewLyrics(event) {
    const { index } = event.currentTarget.dataset
    const song = this.data.searchResults[index]
    
    if (!song) {
      console.error('未找到歌曲信息', { index, searchResults: this.data.searchResults })
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
      selectedPlatform: this.data.selectedPlatform
    })

    // 将歌曲数据保存到本地存储
    const songData = {
      id: song.id,
      source: this.data.selectedPlatform,
      title: song.name || song.title || '',
      artist: song.artist || '',
      album: song.album || '',
      platform_name: song.platform_name || '',
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
    
    // 简化跳转，不传递参数
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

  addToCollection(event) {
    const { index } = event.currentTarget.dataset
    const song = this.data.searchResults[index]
    if (!song) {
      return
    }

    this.setData({
      selectedSong: song,
      showCollectionModal: true
    })
  },

  closeCollectionModal() {
    this.setData({
      showCollectionModal: false,
      selectedSong: null
    })
  },

  createNewCollection() {
    this.setData({
      showCollectionModal: false,
      showCreateModal: true
    })
  },

  closeCreateModal() {
    this.setData({
      showCreateModal: false,
      newCollectionName: '',
      newCollectionDescription: '',
      canCreateCollection: false
    })
  },

  addSongToCollection(event) {
    const collectionId = event.currentTarget.dataset.id
    const { selectedSong, selectedPlatform } = this.data
    if (!collectionId || !selectedSong) {
      return
    }

    const collections = this.data.collections.map((collection) => ({ ...collection }))
    const collectionIndex = collections.findIndex((item) => String(item.id) === String(collectionId))
    if (collectionIndex === -1) {
      return
    }

    const collection = collections[collectionIndex]
    const exists = (collection.songs || []).some(
      (song) => String(song.id) === String(selectedSong.id) && Number(song.source) === Number(selectedPlatform)
    )

    if (exists) {
      this.showErrorMessage('该歌曲已在此合集中')
      return
    }

    const songToAdd = {
      id: selectedSong.id,
      title: selectedSong.name,
      artist: selectedSong.artist,
      album: selectedSong.album,
      source: selectedPlatform,
      addedAt: new Date().toISOString()
    }

    if (!Array.isArray(collection.songs)) {
      collection.songs = []
    }
    collection.songs.push(songToAdd)
    collections[collectionIndex] = collection
    this.persistCollections(collections)

    this.showSuccessMessage(`已添加到合集 "${collection.name}"`)
    this.closeCollectionModal()
  },

  createAndAddToCollection() {
    if (!this.data.canCreateCollection) {
      return
    }

    const { selectedSong, selectedPlatform } = this.data
    const collections = this.data.collections.map((collection) => ({ ...collection }))

    const newCollection = {
      id: Date.now(),
      name: this.data.newCollectionName.trim(),
      description: this.data.newCollectionDescription.trim(),
      createdAt: new Date().toISOString(),
      songs: []
    }

    if (selectedSong) {
      newCollection.songs.push({
        id: selectedSong.id,
        title: selectedSong.name,
        artist: selectedSong.artist,
        album: selectedSong.album,
        source: selectedPlatform,
        addedAt: new Date().toISOString()
      })
    }

    collections.unshift(newCollection)
    this.persistCollections(collections)

    this.showSuccessMessage(
      `已创建合集 "${newCollection.name}"${selectedSong ? ' 并添加歌曲' : ''}`
    )

    this.closeCreateModal()
    this.closeCollectionModal()
  },

  clearError() {
    this.setData({
      error: ''
    })
  },

  showSuccessMessage(message) {
    this.clearToastTimers()
    this.setData({
      showSuccessToast: true,
      successMessage: message
    })
    this.successToastTimer = setTimeout(() => {
      this.setData({
        showSuccessToast: false
      })
    }, 3000)
  },

  showErrorMessage(message) {
    this.clearToastTimers()
    this.setData({
      showErrorToast: true,
      errorMessage: message
    })
    this.errorToastTimer = setTimeout(() => {
      this.setData({
        showErrorToast: false
      })
    }, 3000)
  },

  clearToastTimers() {
    if (this.successToastTimer) {
      clearTimeout(this.successToastTimer)
      this.successToastTimer = null
    }
    if (this.errorToastTimer) {
      clearTimeout(this.errorToastTimer)
      this.errorToastTimer = null
    }
  },

  persistCollections(collections) {
    this.setData({ collections })
    setCollections(collections)
    if (app && typeof app.updateCollections === 'function') {
      app.updateCollections(collections)
    }
  },

  loadCollections() {
    let collections = []
    if (app && app.globalData && Array.isArray(app.globalData.collections) && app.globalData.collections.length) {
      collections = app.globalData.collections
    } else {
      collections = getCollections()
    }

    const normalized = collections.map((collection) => ({
      ...collection,
      songs: Array.isArray(collection.songs) ? collection.songs : []
    }))

    this.setData({
      collections: normalized
    })
  },

  noop() {}
})
