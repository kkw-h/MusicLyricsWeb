import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000'

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    console.error('API请求错误:', error)
    return Promise.reject(error)
  }
)

// 音乐API服务
export const musicAPI = {
  // 搜索歌曲
  searchSongs(params) {
    return api.get('/api/v1/search', { params })
  },

  // 获取歌词
  getLyrics(params) {
    return api.get('/api/v1/lyrics', { params })
  },

  // 获取歌曲详情
  getSongInfo(songId, source = 1) {
    return api.get(`/api/v1/song/${songId}`, { params: { source } })
  },

  // 获取支持的平台列表
  getPlatforms() {
    return api.get('/api/v1/platforms')
  },

  // 测试接口
  test() {
    return api.get('/api/v1/test')
  }
}

export default musicAPI