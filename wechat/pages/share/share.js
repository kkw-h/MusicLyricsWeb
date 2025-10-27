import { getCollections, setCollections } from '../../utils/storage'

const app = getApp()

Page({
  data: {
    collection: null,
    loading: true,
    error: '',
    importing: false,
    showSuccess: false,
    successMessage: '歌单导入成功！'
  },

  onLoad(options) {
    this.loadSharedCollection(options || {})
  },

  onUnload() {
    this.clearToastTimer()
  },

  loadSharedCollection(options) {
    try {
      const encodedData = options.data || options.scene
      if (!encodedData) {
        this.setData({
          loading: false,
          error: '无效的分享链接'
        })
        return
      }

      const decoded = decodeURIComponent(encodedData)
      const collection = JSON.parse(decoded)
      collection.shareTime = Date.now()
      collection.formattedShareTime = this.formatDate(collection.shareTime)

      this.sharePath = `/pages/share/share?data=${encodeURIComponent(JSON.stringify(collection))}`

      this.setData({
        collection,
        loading: false
      })
    } catch (error) {
      console.error('解析分享数据失败', error)
      this.setData({
        loading: false,
        error: '分享链接格式错误'
      })
    }
  },

  async importCollection() {
    if (this.data.importing || !this.data.collection) return

    this.setData({ importing: true })

    try {
      const existingCollections = getCollections()
      const collectionClone = JSON.parse(JSON.stringify(this.data.collection))

      let targetCollections = existingCollections || []
      const existingIndex = targetCollections.findIndex((item) => item.name === collectionClone.name)

      if (existingIndex !== -1) {
        const res = await new Promise((resolve) => {
          wx.showModal({
            title: '合集已存在',
            content: `合集「${collectionClone.name}」已存在，是否覆盖原合集？`,
            confirmText: '覆盖',
            cancelText: '创建副本',
            success: resolve,
            fail: () => resolve({ confirm: false, cancel: true })
          })
        })

        if (res.confirm) {
          targetCollections[existingIndex] = {
            ...targetCollections[existingIndex],
            ...collectionClone,
            id: targetCollections[existingIndex].id,
            updatedAt: Date.now()
          }
        } else {
          let counter = 1
          let newName = `${collectionClone.name} (副本)`
          while (targetCollections.some((item) => item.name === newName)) {
            counter += 1
            newName = `${collectionClone.name} (副本${counter})`
          }
          collectionClone.name = newName
          collectionClone.id = Date.now()
          collectionClone.createdAt = Date.now()
          collectionClone.updatedAt = Date.now()
          targetCollections.push(collectionClone)
        }
      } else {
        collectionClone.id = Date.now()
        collectionClone.createdAt = Date.now()
        collectionClone.updatedAt = Date.now()
        targetCollections.push(collectionClone)
      }

      setCollections(targetCollections)
      if (app && typeof app.updateCollections === 'function') {
        app.updateCollections(targetCollections)
      }

      this.showToast('歌单导入成功！')
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/collection/collection'
        })
      }, 1500)
    } catch (error) {
      console.error('导入合集失败', error)
      wx.showToast({
        title: '导入失败，请重试',
        icon: 'none'
      })
    } finally {
      this.setData({ importing: false })
    }
  },

  playLyrics(event) {
    if (!this.data.collection) return
    const { index } = event.currentTarget.dataset
    const song = this.data.collection.songs[index]
    if (!song) return

    const query = []
    if (song.id) query.push(`id=${encodeURIComponent(song.id)}`)
    if (song.source !== undefined) query.push(`source=${song.source}`)
    if (song.title) query.push(`title=${encodeURIComponent(song.title)}`)
    if (song.artist) query.push(`artist=${encodeURIComponent(song.artist)}`)

    wx.navigateTo({
      url: `/pages/lyrics/lyrics?${query.join('&')}`
    })
  },

  copyShareLink() {
    const link = this.sharePath || ''
    if (!link) {
      wx.showToast({
        title: '暂无可复制的链接',
        icon: 'none'
      })
      return
    }

    wx.setClipboardData({
      data: link,
      success: () => {
        this.showToast('分享链接已复制到剪贴板！')
      }
    })
  },

  goBack() {
    const pages = getCurrentPages()
    if (pages.length > 1) {
      wx.navigateBack({ delta: 1 })
    } else {
      wx.switchTab({
        url: '/pages/search/search'
      })
    }
  },

  formatDate(timestamp) {
    if (!timestamp) return ''
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  showToast(message) {
    this.clearToastTimer()
    this.setData({
      showSuccess: true,
      successMessage: message
    })

    this.toastTimer = setTimeout(() => {
      this.setData({ showSuccess: false })
    }, 2000)
  },

  clearToastTimer() {
    if (this.toastTimer) {
      clearTimeout(this.toastTimer)
      this.toastTimer = null
    }
  }
})
