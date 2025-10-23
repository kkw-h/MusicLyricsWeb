import express from 'express'
import cors from 'cors'
import { MusicAPI } from 'music-api-sdk'

const app = express()
const PORT = process.env.PORT || 3001

// 初始化音乐API
const musicAPI = new MusicAPI()

// 中间件
app.use(cors())
app.use(express.json())

// 网易云音乐搜索接口
app.get('/api/netease/search', async (req, res) => {
  try {
    const { keywords, limit = 20, offset = 0 } = req.query
    
    if (!keywords) {
      return res.status(400).json({
        code: 400,
        message: '缺少搜索关键词',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    const result = await musicAPI.searchNetease(keywords, parseInt(limit), parseInt(offset))

    if (result.code !== 200) {
      return res.status(500).json({
        code: 500,
        message: '搜索失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    // 转换为项目统一格式
    const songs = result.data.songs?.map(song => ({
      id: song.id?.toString() || '',
      name: song.name || '',
      artist: song.artist || '',
      album: song.album || '',
      duration: song.duration || 0,
      platform: 0,
      platform_name: '网易云音乐',
      cover_url: song.cover_url || ''
    })) || []

    res.json({
      code: 200,
      message: 'success',
      data: {
        songs,
        keyword: keywords,
        limit: parseInt(limit),
        offset: parseInt(offset),
        platform: 0
      },
      timestamp: Math.floor(Date.now() / 1000)
    })
  } catch (error) {
    console.error('网易云音乐搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '搜索失败',
      data: null,
      timestamp: Math.floor(Date.now() / 1000)
    })
  }
})

// 网易云音乐歌词接口
app.get('/api/netease/lyric', async (req, res) => {
  try {
    const { id } = req.query
    
    if (!id) {
      return res.status(400).json({
        code: 400,
        message: '缺少歌曲ID',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    const result = await musicAPI.getNeteaselyric(id)
    
    if (result.code !== 200) {
      return res.status(404).json({
        code: 404,
        message: '歌词获取失败',
        data: { song_id: id, platform: 0 },
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    // 解析歌词数据
    const lrc = result.data?.lyric || ''
    const tlyric = result.data?.tlyric || ''
    
    // 解析LRC歌词
    const lyrics = parseLyrics(lrc, tlyric, true)
    
    // 获取歌曲基本信息
    let songName = ''
    let artist = ''
    
    if (lrc) {
      const titleMatch = lrc.match(/\[ti:(.*?)\]/)
      const artistMatch = lrc.match(/\[ar:(.*?)\]/)
      songName = titleMatch ? titleMatch[1].trim() : ''
      artist = artistMatch ? artistMatch[1].trim() : ''
    }
    
    const lyricsData = {
      song_name: songName,
      artist: artist,
      has_lyric: lrc.length > 0,
      has_translation: tlyric.length > 0,
      lyrics: lyrics,
      raw_lyric: lrc,
      translated_lyric: tlyric
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...lyricsData,
        song_id: id,
        platform: 0
      },
      timestamp: Math.floor(Date.now() / 1000)
    })
  } catch (error) {
    console.error('获取网易云音乐歌词失败:', error)
    res.status(500).json({
      code: 500,
      message: '歌词获取失败',
      data: { song_id: req.query.id, platform: 0 },
      timestamp: Math.floor(Date.now() / 1000)
    })
  }
})

// QQ音乐搜索接口
app.get('/api/qq/search', async (req, res) => {
  try {
    const { keywords, limit = 20, offset = 0 } = req.query
    
    if (!keywords) {
      return res.status(400).json({
        code: 400,
        message: '缺少搜索关键词',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    const result = await musicAPI.searchQQ(keywords, parseInt(limit), parseInt(offset))

    if (result.code !== 200) {
      return res.status(500).json({
        code: 500,
        message: '搜索失败',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    // 转换为项目统一格式
    const songs = result.data.songs?.map(song => ({
      id: song.songmid || song.id?.toString() || '',
      name: song.name || '',
      artist: song.artist || '',
      album: song.album || '',
      duration: song.duration || 0,
      platform: 1,
      platform_name: 'QQ音乐',
      cover_url: song.cover_url || ''
    })) || []

    res.json({
      code: 200,
      message: 'success',
      data: {
        songs,
        keyword: keywords,
        limit: parseInt(limit),
        offset: parseInt(offset),
        platform: 1
      },
      timestamp: Math.floor(Date.now() / 1000)
    })
  } catch (error) {
    console.error('QQ音乐搜索失败:', error)
    res.status(500).json({
      code: 500,
      message: '搜索失败',
      data: null,
      timestamp: Math.floor(Date.now() / 1000)
    })
  }
})

// QQ音乐歌词接口
app.get('/api/qq/lyric', async (req, res) => {
  try {
    const { id } = req.query
    
    if (!id) {
      return res.status(400).json({
        code: 400,
        message: '缺少歌曲ID',
        data: null,
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    const result = await musicAPI.getQQlyric(id)
    
    if (result.code !== 200) {
      console.error('QQ音乐歌词获取失败:', result)
      return res.status(404).json({
        code: 404,
        message: '歌词获取失败',
        data: { song_id: id, platform: 1 },
        timestamp: Math.floor(Date.now() / 1000)
      })
    }

    // 解析歌词数据
    const lrc = result.data?.lyric || ''
    const tlyric = result.data?.trans || ''
    
    // 解析LRC歌词
    const lyrics = parseLyrics(lrc, tlyric, true)
    
    // 获取歌曲基本信息
    let songName = ''
    let artist = ''
    
    if (lrc) {
      const titleMatch = lrc.match(/\[ti:(.*?)\]/)
      const artistMatch = lrc.match(/\[ar:(.*?)\]/)
      songName = titleMatch ? titleMatch[1].trim() : ''
      artist = artistMatch ? artistMatch[1].trim() : ''
    }
    
    const lyricsData = {
      song_name: songName,
      artist: artist,
      has_lyric: lrc.length > 0,
      has_translation: tlyric.length > 0,
      lyrics: lyrics,
      raw_lyric: lrc,
      translated_lyric: tlyric
    }

    res.json({
      code: 200,
      message: 'success',
      data: {
        ...lyricsData,
        song_id: id,
        platform: 1
      },
      timestamp: Math.floor(Date.now() / 1000)
    })
  } catch (error) {
    console.error('获取QQ音乐歌词失败:', error)
    res.status(500).json({
      code: 500,
      message: '歌词获取失败',
      data: { song_id: req.query.id, platform: 1 },
      timestamp: Math.floor(Date.now() / 1000)
    })
  }
})

// 解析LRC歌词的辅助函数
function parseLyrics(lrc, tlyric = '', includeTranslation = true) {
  const lyrics = []
  const lrcLines = lrc.split('\n')
  const tlyricLines = tlyric.split('\n')
  
  // 创建翻译映射
  const translationMap = new Map()
  if (includeTranslation && tlyric) {
    tlyricLines.forEach(line => {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
      if (match) {
        const time = parseFloat(match[1]) * 60 + parseFloat(match[2]) + parseFloat(match[3]) / (match[3].length === 2 ? 100 : 1000)
        translationMap.set(time, match[4].trim())
      }
    })
  }
  
  lrcLines.forEach(line => {
    const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2,3})\](.*)/)
    if (match) {
      const time = parseFloat(match[1]) * 60 + parseFloat(match[2]) + parseFloat(match[3]) / (match[3].length === 2 ? 100 : 1000)
      const text = match[4].trim()
      const translation = translationMap.get(time) || null
      
      lyrics.push({
        time: time,
        text: text,
        translation: translation
      })
    }
  })
  
  return lyrics.sort((a, b) => a.time - b.time)
}

// 启动服务器
// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

app.listen(PORT, () => {
  console.log(`音乐API服务器运行在 http://localhost:${PORT}`)
  console.log('支持的接口:')
  console.log('- 网易云音乐搜索: GET /api/netease/search')
  console.log('- 网易云音乐歌词: GET /api/netease/lyric')
  console.log('- QQ音乐搜索: GET /api/qq/search')
  console.log('- QQ音乐歌词: GET /api/qq/lyric')
})