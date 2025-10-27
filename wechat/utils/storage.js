export function getCollections() {
  try {
    return wx.getStorageSync('musicCollections') || []
  } catch (error) {
    console.warn('读取合集缓存失败', error)
    return []
  }
}

export function setCollections(collections = []) {
  try {
    wx.setStorageSync('musicCollections', collections)
  } catch (error) {
    console.warn('写入合集缓存失败', error)
  }
}

export function getLyricsCache(cacheKey) {
  try {
    const cached = wx.getStorageSync(cacheKey)
    if (cached) {
      return cached
    }
  } catch (error) {
    console.warn('读取歌词缓存失败', error)
  }
  return null
}

export function setLyricsCache(cacheKey, data) {
  try {
    wx.setStorageSync(cacheKey, data)
  } catch (error) {
    console.warn('写入歌词缓存失败', error)
  }
}

export function removeStorage(key) {
  try {
    wx.removeStorageSync(key)
  } catch (error) {
    console.warn(`移除缓存 ${key} 失败`, error)
  }
}

export function getLastPlayedSong() {
  try {
    return wx.getStorageSync('lastPlayedSong') || null
  } catch (error) {
    console.warn('读取最后播放歌曲失败', error)
    return null
  }
}

export function setLastPlayedSong(song) {
  try {
    wx.setStorageSync('lastPlayedSong', song)
  } catch (error) {
    console.warn('写入最后播放歌曲失败', error)
  }
}
