import axios from 'axios'

// 后端API基础URL - 使用代理路径
const baseURL = '/api/netease'

// 创建axios实例
const request = axios.create({
  baseURL,
  timeout: 10000
})

// 网易云音乐服务类
class NeteaseService {
  /**
   * 搜索歌曲
   * @param {string} keywords - 搜索关键词
   * @param {number} limit - 返回数量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 搜索结果
   */
  async searchSongs(keywords, limit = 20, offset = 0) {
    try {
      const response = await request.get('/search', {
        params: {
          keywords,
          limit,
          offset
        }
      })
      return response.data
    } catch (error) {
      console.error('网易云音乐搜索失败:', error)
      throw new Error('搜索失败')
    }
  }

  /**
   * 获取歌词
   * @param {string} songId - 歌曲ID
   * @returns {Promise<Object>} 歌词数据
   */
  async getLyrics(songId) {
    try {
      const response = await request.get('/lyric', {
        params: {
          id: songId
        }
      })
      return response.data
    } catch (error) {
      console.error('获取网易云音乐歌词失败:', error)
      throw new Error('歌词获取失败')
    }
  }

  /**
   * 获取歌曲信息（兼容旧接口）
   * @param {string} songId - 歌曲ID
   * @returns {Promise<Object>} 歌曲信息
   */
  async getSongInfo(songId) {
    // 由于music-api-sdk主要提供搜索和歌词功能
    // 这里返回基本的歌曲信息结构
    try {
      const lyricsData = await this.getLyrics(songId)
      return {
        code: 200,
        message: 'success',
        data: {
          id: songId,
          name: lyricsData.data?.song_name || '',
          artist: lyricsData.data?.artist || '',
          album: '',
          duration: 0,
          platform: 0,
          platform_name: '网易云音乐',
          cover_url: ''
        },
        timestamp: Math.floor(Date.now() / 1000)
      }
    } catch (error) {
      console.error('获取网易云音乐歌曲信息失败:', error)
      throw new Error('歌曲信息获取失败')
    }
  }
}

export default new NeteaseService()