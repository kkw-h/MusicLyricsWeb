import NeteaseService from './services/netease.js'
import QQMusicService from './services/qq.js'

// 初始化音乐服务
const neteaseService = NeteaseService
const qqMusicService = QQMusicService

// 平台映射
const PLATFORMS = {
  0: { service: neteaseService, name: 'netease', display_name: '网易云音乐' },
  1: { service: qqMusicService, name: 'qq', display_name: 'QQ音乐' }
}

// 获取音乐服务实例
function getMusicService(source = 1) {
  const platform = PLATFORMS[source]
  if (!platform) {
    throw new Error(`不支持的音乐平台: ${source}`)
  }
  return platform.service
}

// 音乐API服务
export const musicAPI = {
  // 搜索歌曲
  async searchSongs(params) {
    try {
      const { name, source = 1, limit = 20, offset = 0 } = params
      
      if (!name || name.trim().length === 0) {
        return {
          code: 400,
          message: '搜索关键词不能为空',
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      const service = getMusicService(source)
      return await service.searchSongs(name.trim(), limit, offset)
    } catch (error) {
      console.error('搜索歌曲失败:', error)
      return {
        code: 500,
        message: error.message || '搜索失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  },

  // 获取歌词
  async getLyrics(params) {
    try {
      const { id, source = 1, format = 1, include_translation = true } = params
      
      if (!id) {
        return {
          code: 400,
          message: '歌曲ID不能为空',
          data: null,
          timestamp: Math.floor(Date.now() / 1000)
        }
      }

      const service = getMusicService(source)
      return await service.getLyrics(id, format, include_translation)
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

  // 获取歌曲详情
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

      const service = getMusicService(source)
      return await service.getSongInfo(songId)
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
      return {
        code: 200,
        message: 'Hello World!',
        data: {
          status: 'API is running',
          platforms: Object.keys(PLATFORMS).map(key => PLATFORMS[key].display_name)
        },
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('测试接口失败:', error)
      return {
        code: 500,
        message: '测试接口失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      }
    }
  }
}

export default musicAPI