// 统一音乐 API 服务
// 基于 OpenAPI 文档规范的接口调用

// API 配置
const API_CONFIG = {
  baseURL: 'https://kkw-api.kkworld.top',
  endpoints: {
    search: '/api/v1/music/search',
    lyric: '/api/v1/music/lyric'
  }
}

// 平台映射 - 根据 OpenAPI 文档
const PLATFORMS = {
  0: { name: 'netease', display_name: '网易云音乐' },
  1: { name: 'qqmusic', display_name: 'QQ音乐' }
}

// HTTP 请求工具函数
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('API 请求失败:', error)
    throw error
  }
}

// 构建 URL 参数
function buildQueryString(params) {
  const searchParams = new URLSearchParams()
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      searchParams.append(key, params[key])
    }
  })
  return searchParams.toString()
}

// 音乐API服务
export const musicAPI = {
  // 搜索歌曲 - 使用统一接口
  async searchSongs(params) {
    try {
      const { name, source = 1, limit = 30, offset = 0 } = params
      
      if (!name || name.trim().length === 0) {
        return {
          code: 400,
          message: '搜索关键词不能为空',
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      // 根据 OpenAPI 文档构建请求参数
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
        type: 1, // 默认搜索单曲
        limit: Math.min(limit, 100), // API 限制最大 100
        offset: Math.max(offset, 0)
      }

      const queryString = buildQueryString(queryParams)
      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.search}?${queryString}`

      const response = await makeRequest(url)
      
      // 格式化返回数据以保持兼容性
      if (response && response.songs) {
        return {
          code: 200,
          message: 'success',
          data: {
            songs: response.songs.map(song => ({
              id: song.id,
              name: song.name,
              artist: Array.isArray(song.ar) ? song.ar.map(a => a.name).join('/') : song.artist,
              album: song.al ? song.al.name : song.album,
              platform_name: platform.display_name,
              source: source
            }))
          },
          timestamp: Math.floor(Date.now() / 1000)
        }
      } else {
        return {
          code: 200,
          message: 'success',
          data: { songs: [] },
          timestamp: Math.floor(Date.now() / 1000)
        }
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

  // 获取歌词 - 使用统一接口
  async getLyrics(params) {
    try {
      const { id, source = 1 } = params
      
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

      const queryParams = {
        platform: platform.name
      }

      const queryString = buildQueryString(queryParams)
      const url = `${API_CONFIG.baseURL}${API_CONFIG.endpoints.lyric}/${id}?${queryString}`

      const response = await makeRequest(url)
      
      // 格式化返回数据以保持兼容性
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
  },

  // 获取歌曲详情（保留兼容性）
  async getSongInfo(songId, source = 1) {
    try {
      if (!songId) {
        return {
          code: 400,
          message: '歌曲ID不能为空',
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      // 暂时返回基本信息，后续可以扩展
      return {
        code: 200,
        message: 'success',
        data: {
          id: songId,
          source: source,
          platform_name: PLATFORMS[source]?.display_name || '未知平台'
        },
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('获取歌曲信息失败:', error)
      return {
        code: 500,
        message: error.message || '获取歌曲信息失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  },

  // 获取支持的平台列表
  async getPlatforms() {
    try {
      const platforms = {}
      Object.keys(PLATFORMS).forEach(key => {
        const platform = PLATFORMS[key]
        platforms[key] = {
          name: platform.name,
          display_name: platform.display_name
        }
      })

      return {
        code: 200,
        message: 'success',
        data: { platforms },
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('获取平台列表失败:', error)
      return {
        code: 500,
        message: '获取平台列表失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  },

  // 测试接口
  async test() {
    try {
      const url = `${API_CONFIG.baseURL}/health`
      const response = await makeRequest(url)
      
      return {
        code: 200,
        message: 'API 连接正常',
        data: {
          status: 'API is running',
          baseURL: API_CONFIG.baseURL,
          platforms: Object.keys(PLATFORMS).map(key => PLATFORMS[key].display_name),
          health: response
        },
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('测试接口失败:', error)
      return {
        code: 500,
        message: '测试接口失败: ' + error.message,
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  }
}

export default musicAPI