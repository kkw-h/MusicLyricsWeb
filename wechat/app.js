App({
  globalData: {
    // 记录全局的收藏合集，便于页面之间同步
    collections: [],
    // 记录最后一次播放的歌曲
    lastPlayedSong: null
  },

  onLaunch() {
    // 小程序启动时从本地同步读取合集与歌词缓存
    try {
      const collections = wx.getStorageSync('musicCollections') || []
      this.globalData.collections = collections
      const lastPlayed = wx.getStorageSync('lastPlayedSong')
      if (lastPlayed) {
        this.globalData.lastPlayedSong = lastPlayed
      }
    } catch (error) {
      console.warn('初始化本地缓存失败', error)
    }
  },

  updateCollections(collections) {
    this.globalData.collections = collections
    try {
      wx.setStorageSync('musicCollections', collections)
    } catch (error) {
      console.warn('写入合集缓存失败', error)
    }
  },

  setLastPlayedSong(song) {
    this.globalData.lastPlayedSong = song
    try {
      wx.setStorageSync('lastPlayedSong', song)
    } catch (error) {
      console.warn('写入最后播放歌曲失败', error)
    }
  }
})
