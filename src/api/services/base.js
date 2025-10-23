/**
 * 音乐服务基类
 * 定义音乐平台服务的通用接口
 */
export class BaseMusicService {
  constructor(name, displayName) {
    this.name = name
    this.displayName = displayName
  }

  /**
   * 搜索歌曲
   * @param {string} keyword - 搜索关键词
   * @param {number} limit - 返回数量限制
   * @param {number} offset - 偏移量
   * @returns {Promise<Object>} 搜索结果
   */
  async searchSongs(keyword, limit = 20, offset = 0) {
    throw new Error('searchSongs method must be implemented')
  }

  /**
   * 获取歌词
   * @param {string} songId - 歌曲ID
   * @param {number} format - 歌词格式 (1: LRC, 2: SRT, 3: TXT)
   * @param {boolean} includeTranslation - 是否包含翻译
   * @returns {Promise<Object>} 歌词数据
   */
  async getLyrics(songId, format = 1, includeTranslation = true) {
    throw new Error('getLyrics method must be implemented')
  }

  /**
   * 获取歌曲详情
   * @param {string} songId - 歌曲ID
   * @returns {Promise<Object>} 歌曲详情
   */
  async getSongInfo(songId) {
    throw new Error('getSongInfo method must be implemented')
  }

  /**
   * 格式化搜索结果
   * @param {Array} songs - 原始歌曲数据
   * @param {string} keyword - 搜索关键词
   * @param {number} limit - 限制数量
   * @param {number} offset - 偏移量
   * @param {number} platform - 平台ID
   * @returns {Object} 格式化后的搜索结果
   */
  formatSearchResult(songs, keyword, limit, offset, platform) {
    return {
      code: 200,
      message: 'success',
      data: {
        songs: songs,
        total: songs.length,
        limit: limit,
        offset: offset,
        platform: platform,
        platform_name: this.displayName,
        keyword: keyword
      },
      timestamp: Math.floor(Date.now() / 1000)
    }
  }

  /**
   * 格式化歌词结果
   * @param {Object} lyricsData - 原始歌词数据
   * @param {string} songId - 歌曲ID
   * @param {number} platform - 平台ID
   * @returns {Object} 格式化后的歌词结果
   */
  formatLyricsResult(lyricsData, songId, platform) {
    return {
      code: 200,
      message: 'success',
      data: {
        song_id: songId,
        song_name: lyricsData.song_name || '',
        artist: lyricsData.artist || '',
        platform: platform,
        platform_name: this.displayName,
        has_lyric: lyricsData.has_lyric || false,
        has_translation: lyricsData.has_translation || false,
        lyrics: lyricsData.lyrics || [],
        raw_lyric: lyricsData.raw_lyric || '',
        translated_lyric: lyricsData.translated_lyric || null
      },
      timestamp: Math.floor(Date.now() / 1000)
    }
  }

  /**
   * 处理错误响应
   * @param {string} message - 错误信息
   * @param {number} code - 错误代码
   * @param {Object} data - 附加数据
   * @returns {Object} 错误响应
   */
  formatErrorResponse(message, code = 500, data = null) {
    return {
      code: code,
      message: message,
      data: data,
      timestamp: Math.floor(Date.now() / 1000)
    }
  }
}