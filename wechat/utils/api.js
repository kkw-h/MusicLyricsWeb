const API_CONFIG = {
  baseURL: 'https://kkw-api.kkworld.top',
  endpoints: {
    search: '/api/v1/music/search',
    lyric: '/api/v1/music/lyric'
  }
}

const PLATFORMS = {
  0: { name: 'netease', display_name: '网易云音乐' },
  1: { name: 'qqmusic', display_name: 'QQ音乐' }
}

function buildQueryString(params = {}) {
  const searchParams = []
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value !== undefined && value !== null && value !== '') {
      searchParams.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    }
  })
  return searchParams.join('&')
}

function makeRequest(url, { method = 'GET', data = {}, header = {} } = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success(response) {
        const { statusCode, data: responseData } = response
        if (statusCode >= 200 && statusCode < 300) {
          resolve(responseData)
        } else {
          reject(new Error(`HTTP ${statusCode}`))
        }
      },
      fail(error) {
        reject(error)
      }
    })
  })
}

export const musicAPI = {
  async searchSongs(params) {
    try {
      const { name, source = 1, limit = 30, offset = 0 } = params || {}

      if (!name || !name.trim()) {
        return {
          code: 400,
          message: '搜索关键词不能为空',
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      const platform = PLATFORMS[source]
      if (!platform) {
        return {
          code: 400,
          message: `不支持的音乐平台: ${source}`,
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      const queryParams = {
        keywords: name.trim(),
        platform: platform.name,
        type: 1,
        limit: Math.min(limit, 100),
        offset: Math.max(offset, 0)
      }

      const queryString = buildQueryString(queryParams)
      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.search}?${queryString}`
      const response = await makeRequest(url)

      if (response && response.songs) {
        return {
          code: 200,
          message: 'success',
          data: {
            songs: response.songs.map((song) => ({
              id: song.id,
              name: song.name,
              artist: Array.isArray(song.artists) ? song.artists.map((item) => item.name).join('/') : song.artists,
              album: song.al ? song.al.name : song.album,
              platform_name: platform.display_name,
              source
            }))
          },
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      return {
        code: 200,
        message: 'success',
        data: { songs: [] },
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('搜索歌曲失败:', error)
      return {
        code: 500,
        message: error.message || '搜索失败，请稍后重试',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  },

  async getLyrics(params) {
    try {
      const { id, source = 1 } = params || {}

      if (!id) {
        return {
          code: 400,
          message: '歌曲ID不能为空',
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      const platform = PLATFORMS[source]
      if (!platform) {
        return {
          code: 400,
          message: `不支持的音乐平台: ${source}`,
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      const queryString = buildQueryString({ platform: platform.name })
      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lyric}/${id}?${queryString}`
      const response = await makeRequest(url)

      return {
        code: 200,
        message: 'success',
        data: response,
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('获取歌词失败:', error)
      return {
        code: 500,
        message: error.message || '获取歌词失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  }
}

export default musicAPI
