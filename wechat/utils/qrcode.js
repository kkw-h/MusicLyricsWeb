/*!
 * QRCode for JavaScript
 * Copyright (c) 2009 Kazuhiko Arase
 * URL: http://www.d-project.com/
 * Licensed under the MIT license
 * https://github.com/kazuhikoarase/qrcode-generator
 */

/* eslint-disable */

const qrcode = (function () {
  const qrcode = function (typeNumber, errorCorrectLevel) {
    const PAD0 = 0xec
    const PAD1 = 0x11
    let _typeNumber = typeNumber
    let _errorCorrectLevel = QRErrorCorrectLevel[errorCorrectLevel]
    let _modules = null
    let _moduleCount = 0
    let _dataCache = null
    const _dataList = []

    const makeImpl = function (test, maskPattern) {
      _moduleCount = _typeNumber * 4 + 17
      _modules = new Array(_moduleCount)
      for (let row = 0; row < _moduleCount; row += 1) {
        _modules[row] = new Array(_moduleCount)
        for (let col = 0; col < _moduleCount; col += 1) {
          _modules[row][col] = null
        }
      }
      setupPositionProbePattern(0, 0)
      setupPositionProbePattern(_moduleCount - 7, 0)
      setupPositionProbePattern(0, _moduleCount - 7)
      setupPositionAdjustPattern()
      setupTimingPattern()
      setupTypeInfo(test, maskPattern)
      if (_typeNumber >= 7) {
        setupTypeNumber(test)
      }
      if (_dataCache === null) {
        _dataCache = createData(_typeNumber, _errorCorrectLevel, _dataList)
      }
      mapData(_dataCache, maskPattern)
    }

    const setupPositionProbePattern = function (row, col) {
      for (let r = -1; r <= 7; r += 1) {
        if (row + r <= -1 || _moduleCount <= row + r) continue
        for (let c = -1; c <= 7; c += 1) {
          if (col + c <= -1 || _moduleCount <= col + c) continue
          if (
            (0 <= r && r <= 6 && (c === 0 || c === 6)) ||
            (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
            (2 <= r && r <= 4 && 2 <= c && c <= 4)
          ) {
            _modules[row + r][col + c] = true
          } else {
            _modules[row + r][col + c] = false
          }
        }
      }
    }

    const getBestMaskPattern = function () {
      let minLostPoint = 0
      let pattern = 0
      for (let i = 0; i < 8; i += 1) {
        makeImpl(true, i)
        const lostPoint = QRUtil.getLostPoint(qrcode)
        if (i === 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint
          pattern = i
        }
      }
      return pattern
    }

    const setupTimingPattern = function () {
      for (let r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] !== null) continue
        _modules[r][6] = r % 2 === 0
      }
      for (let c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] !== null) continue
        _modules[6][c] = c % 2 === 0
      }
    }

    const setupPositionAdjustPattern = function () {
      const pos = QRUtil.getPatternPosition(_typeNumber)
      for (let i = 0; i < pos.length; i += 1) {
        for (let j = 0; j < pos.length; j += 1) {
          const row = pos[i]
          const col = pos[j]
          if (_modules[row][col] !== null) continue
          for (let r = -2; r <= 2; r += 1) {
            for (let c = -2; c <= 2; c += 1) {
              if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                _modules[row + r][col + c] = true
              } else {
                _modules[row + r][col + c] = false
              }
            }
          }
        }
      }
    }

    const setupTypeNumber = function (test) {
      const bits = QRUtil.getBCHTypeNumber(_typeNumber)
      for (let i = 0; i < 18; i += 1) {
        const mod = (!test && ((bits >> i) & 1) === 1)
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod
      }
      for (let i = 0; i < 18; i += 1) {
        const mod = (!test && ((bits >> i) & 1) === 1)
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod
      }
    }

    const setupTypeInfo = function (test, maskPattern) {
      const data = (_errorCorrectLevel << 3) | maskPattern
      const bits = QRUtil.getBCHTypeInfo(data)
      for (let i = 0; i < 15; i += 1) {
        const mod = (!test && ((bits >> i) & 1) === 1)
        if (i < 6) {
          _modules[i][8] = mod
        } else if (i < 8) {
          _modules[i + 1][8] = mod
        } else {
          _modules[_moduleCount - 15 + i][8] = mod
        }
      }
      for (let i = 0; i < 15; i += 1) {
        const mod = (!test && ((bits >> i) & 1) === 1)
        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod
        } else {
          _modules[8][15 - i - 1] = mod
        }
      }
      _modules[_moduleCount - 8][8] = !test
    }

    const mapData = function (data, maskPattern) {
      let inc = -1
      let row = _moduleCount - 1
      let bitIndex = 7
      let byteIndex = 0
      for (let col = _moduleCount - 1; col > 0; col -= 2) {
        if (col === 6) col -= 1
        while (true) {
          for (let c = 0; c < 2; c += 1) {
            if (_modules[row][col - c] === null) {
              let dark = false
              if (byteIndex < data.length) {
                dark = ((data[byteIndex] >>> bitIndex) & 1) === 1
              }
              const mask = QRUtil.getMask(maskPattern, row, col - c)
              if (mask) {
                dark = !dark
              }
              _modules[row][col - c] = dark
              bitIndex -= 1
              if (bitIndex === -1) {
                byteIndex += 1
                bitIndex = 7
              }
            }
          }
          row += inc
          if (row < 0 || _moduleCount <= row) {
            row -= inc
            inc = -inc
            break
          }
        }
      }
    }

    const createBytes = function (buffer, rsBlocks) {
      let offset = 0
      let maxDcCount = 0
      let maxEcCount = 0
      const dcdata = new Array(rsBlocks.length)
      const ecdata = new Array(rsBlocks.length)
      for (let r = 0; r < rsBlocks.length; r += 1) {
        const dcCount = rsBlocks[r].dataCount
        const ecCount = rsBlocks[r].totalCount - dcCount
        maxDcCount = Math.max(maxDcCount, dcCount)
        maxEcCount = Math.max(maxEcCount, ecCount)
        dcdata[r] = new Array(dcCount)
        for (let i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset]
        }
        offset += dcCount
        const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount)
        const rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1)
        const modPoly = rawPoly.mod(rsPoly)
        ecdata[r] = new Array(rsPoly.getLength() - 1)
        for (let i = 0; i < ecdata[r].length; i += 1) {
          const modIndex = i + modPoly.getLength() - ecdata[r].length
          ecdata[r][i] = modIndex >= 0 ? modPoly.get(modIndex) : 0
        }
      }
      let totalCodeCount = 0
      for (let i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount
      }
      const data = new Array(totalCodeCount)
      let index = 0
      for (let i = 0; i < maxDcCount; i += 1) {
        for (let r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i]
            index += 1
          }
        }
      }
      for (let i = 0; i < maxEcCount; i += 1) {
        for (let r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i]
            index += 1
          }
        }
      }
      return data
    }

    const createData = function (typeNumber, errorCorrectLevel, dataList) {
      const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectLevel)
      const buffer = qrBitBuffer()
      for (let i = 0; i < dataList.length; i += 1) {
        const data = dataList[i]
        buffer.put(data.getMode(), 4)
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber))
        data.write(buffer)
      }
      let totalDataCount = 0
      for (let i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount
      }
      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw new Error('code length overflow.')
      }
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4)
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(false)
      }
      while (buffer.getLengthInBits() < totalDataCount * 8) {
        buffer.put(PAD0, 8)
        if (buffer.getLengthInBits() >= totalDataCount * 8) break
        buffer.put(PAD1, 8)
      }
      return createBytes(buffer, rsBlocks)
    }

    const make = function () {
      if (_typeNumber < 1) {
        let typeNumber = 1
        for (; typeNumber < 40; typeNumber += 1) {
          const rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectLevel)
          let buffer = qrBitBuffer()
          for (let i = 0; i < _dataList.length; i += 1) {
            const data = _dataList[i]
            buffer.put(data.getMode(), 4)
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber))
            data.write(buffer)
          }
          let totalDataCount = 0
          for (let i = 0; i < rsBlocks.length; i += 1) {
            totalDataCount += rsBlocks[i].dataCount
          }
          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break
          }
        }
        _typeNumber = typeNumber
      }
      makeImpl(false, getBestMaskPattern())
    }

    const addData = function (data) {
      const newData = qr8BitByte(data)
      _dataList.push(newData)
      _dataCache = null
    }

    const isDark = function (row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw new Error(row + ',' + col)
      }
      return _modules[row][col]
    }

    const getModuleCount = function () {
      return _moduleCount
    }

    const createDataURL = function (cellSize, margin) {
      cellSize = cellSize || 2
      margin = margin === undefined ? cellSize * 4 : margin
      const size = _moduleCount * cellSize + margin * 2
      const min = margin
      const max = size - margin
      return createBase64(size, size, function (x, y) {
        if (margin <= x && x < max && margin <= y && y < max) {
          const c = Math.floor((x - margin) / cellSize)
          const r = Math.floor((y - margin) / cellSize)
          return isDark(r, c) ? 0 : 1
        }
        return 1
      })
    }

    return {
      addData,
      make,
      isDark,
      getModuleCount,
      createDataURL
    }
  }

  qrcode.stringToBytes = function (s) {
    const bytes = []
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i)
      bytes.push(c & 0xff)
    }
    return bytes
  }

  const QRMode = {
    MODE_8BIT_BYTE: 4
  }

  const QRErrorCorrectLevel = {
    L: 1,
    M: 0,
    Q: 3,
    H: 2
  }

  const QRMaskPattern = {
    PATTERN000: 0,
    PATTERN001: 1,
    PATTERN010: 2,
    PATTERN011: 3,
    PATTERN100: 4,
    PATTERN101: 5,
    PATTERN110: 6,
    PATTERN111: 7
  }

  const QRUtil = (function () {
    const PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166]
    ]

    const G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0)
    const G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0)
    const G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1)

    const _getBCHDigit = function (data) {
      let digit = 0
      while (data !== 0) {
        digit += 1
        data >>>= 1
      }
      return digit
    }

    return {
      getPatternPosition(typeNumber) {
        return PATTERN_POSITION_TABLE[typeNumber - 1]
      },

      getMask(maskPattern, i, j) {
        switch (maskPattern) {
          case QRMaskPattern.PATTERN000: return (i + j) % 2 === 0
          case QRMaskPattern.PATTERN001: return i % 2 === 0
          case QRMaskPattern.PATTERN010: return j % 3 === 0
          case QRMaskPattern.PATTERN011: return (i + j) % 3 === 0
          case QRMaskPattern.PATTERN100: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0
          case QRMaskPattern.PATTERN101: return ((i * j) % 2) + ((i * j) % 3) === 0
          case QRMaskPattern.PATTERN110: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0
          case QRMaskPattern.PATTERN111: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0
          default: throw new Error('bad maskPattern:' + maskPattern)
        }
      },

      getErrorCorrectPolynomial(errorCorrectLength) {
        let a = qrPolynomial([1], 0)
        for (let i = 0; i < errorCorrectLength; i += 1) {
          a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0))
        }
        return a
      },

      getLengthInBits(mode, type) {
        if (1 <= type && type < 10) {
          switch (mode) {
            case QRMode.MODE_8BIT_BYTE: return 8
            default: throw new Error('mode:' + mode)
          }
        } else if (type < 27) {
          switch (mode) {
            case QRMode.MODE_8BIT_BYTE: return 16
            default: throw new Error('mode:' + mode)
          }
        } else if (type < 41) {
          switch (mode) {
            case QRMode.MODE_8BIT_BYTE: return 16
            default: throw new Error('mode:' + mode)
          }
        } else {
          throw new Error('type:' + type)
        }
      },

      getLostPoint(qrCode) {
        const moduleCount = qrCode.getModuleCount()
        let lostPoint = 0
        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount; col += 1) {
            let sameCount = 0
            const dark = qrCode.isDark(row, col)
            for (let r = -1; r <= 1; r += 1) {
              if (row + r < 0 || moduleCount <= row + r) continue
              for (let c = -1; c <= 1; c += 1) {
                if (col + c < 0 || moduleCount <= col + c) continue
                if (r === 0 && c === 0) continue
                if (dark === qrCode.isDark(row + r, col + c)) sameCount += 1
              }
            }
            if (sameCount > 5) {
              lostPoint += (3 + sameCount - 5)
            }
          }
        }
        for (let row = 0; row < moduleCount - 1; row += 1) {
          for (let col = 0; col < moduleCount - 1; col += 1) {
            let count = 0
            if (qrCode.isDark(row, col)) count += 1
            if (qrCode.isDark(row + 1, col)) count += 1
            if (qrCode.isDark(row, col + 1)) count += 1
            if (qrCode.isDark(row + 1, col + 1)) count += 1
            if (count === 0 || count === 4) {
              lostPoint += 3
            }
          }
        }
        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount - 6; col += 1) {
            if (
              qrCode.isDark(row, col) &&
              !qrCode.isDark(row, col + 1) &&
              qrCode.isDark(row, col + 2) &&
              qrCode.isDark(row, col + 3) &&
              qrCode.isDark(row, col + 4) &&
              !qrCode.isDark(row, col + 5) &&
              qrCode.isDark(row, col + 6)
            ) {
              lostPoint += 40
            }
          }
        }
        for (let col = 0; col < moduleCount; col += 1) {
          for (let row = 0; row < moduleCount - 6; row += 1) {
            if (
              qrCode.isDark(row, col) &&
              !qrCode.isDark(row + 1, col) &&
              qrCode.isDark(row + 2, col) &&
              qrCode.isDark(row + 3, col) &&
              qrCode.isDark(row + 4, col) &&
              !qrCode.isDark(row + 5, col) &&
              qrCode.isDark(row + 6, col)
            ) {
              lostPoint += 40
            }
          }
        }
        let darkCount = 0
        for (let col = 0; col < moduleCount; col += 1) {
          for (let row = 0; row < moduleCount; row += 1) {
            if (qrCode.isDark(row, col)) darkCount += 1
          }
        }
        const ratio = Math.abs((100 * darkCount / moduleCount / moduleCount) - 50) / 5
        lostPoint += ratio * 10
        return lostPoint
      },

      getBCHTypeInfo(data) {
        let d = data << 10
        while (_getBCHDigit(d) - _getBCHDigit(G15) >= 0) {
          d ^= (G15 << (_getBCHDigit(d) - _getBCHDigit(G15)))
        }
        return ((data << 10) | d) ^ G15_MASK
      },

      getBCHTypeNumber(data) {
        let d = data << 12
        while (_getBCHDigit(d) - _getBCHDigit(G18) >= 0) {
          d ^= (G18 << (_getBCHDigit(d) - _getBCHDigit(G18)))
        }
        return (data << 12) | d
      }
    }
  })()

  const QRMath = (function () {
    const EXP_TABLE = new Array(256)
    const LOG_TABLE = new Array(256)
    for (let i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i
    }
    for (let i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8]
    }
    for (let i = 0; i < 256; i += 1) {
      LOG_TABLE[EXP_TABLE[i]] = i
    }
    return {
      glog(value) {
        if (value < 1) {
          throw new Error('glog(' + value + ')')
        }
        return LOG_TABLE[value]
      },

      gexp(value) {
        while (value < 0) {
          value += 255
        }
        while (value >= 256) {
          value -= 255
        }
        return EXP_TABLE[value]
      }
    }
  })()

  const qrPolynomial = function (num, shift) {
    if (num.length === undefined) {
      throw new Error(num.length + '/' + shift)
    }
    let offset = 0
    while (offset < num.length && num[offset] === 0) {
      offset += 1
    }
    const _num = new Array(num.length - offset + shift)
    for (let i = 0; i < num.length - offset; i += 1) {
      _num[i] = num[i + offset]
    }
    return {
      get(index) {
        return _num[index]
      },

      getLength() {
        return _num.length
      },

      multiply(e) {
        const num = new Array(this.getLength() + e.getLength() - 1)
        for (let i = 0; i < this.getLength(); i += 1) {
          for (let j = 0; j < e.getLength(); j += 1) {
            num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)))
          }
        }
        return qrPolynomial(num, 0)
      },

      mod(e) {
        if (this.getLength() - e.getLength() < 0) {
          return this
        }
        const ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0))
        const num = new Array(this.getLength())
        for (let i = 0; i < this.getLength(); i += 1) {
          num[i] = this.get(i)
        }
        for (let i = 0; i < e.getLength(); i += 1) {
          num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio)
        }
        return qrPolynomial(num, 0).mod(e)
      }
    }
  }

  const qrBitBuffer = function () {
    const _buffer = []
    let _length = 0

    return {
      getBuffer() {
        return _buffer
      },

      getLengthInBits() {
        return _length
      },

      put(num, length) {
        for (let i = 0; i < length; i += 1) {
          this.putBit(((num >>> (length - i - 1)) & 1) === 1)
        }
      },

      putBit(bit) {
        if (_length === _buffer.length * 8) {
          _buffer.push(0)
        }
        if (bit) {
          _buffer[_buffer.length - 1] |= 0x80 >>> (_length % 8)
        }
        _length += 1
      }
    }
  }

  const qr8BitByte = function (data) {
    const _bytes = qrcode.stringToBytes(data)
    return {
      getMode() {
        return QRMode.MODE_8BIT_BYTE
      },

      getLength() {
        return _bytes.length
      },

      write(buffer) {
        for (let i = 0; i < _bytes.length; i += 1) {
          buffer.put(_bytes[i], 8)
        }
      }
    }
  }

  const QRRSBlock = (function () {
    const RS_BLOCK_TABLE = [
      // 1
      [1, 26, 19], [1, 26, 16], [1, 26, 13], [1, 26, 9],
      // 2
      [1, 44, 34], [1, 44, 28], [1, 44, 22], [1, 44, 16],
      // 3
      [1, 70, 55], [1, 70, 44], [2, 35, 17], [2, 35, 13],
      // 4
      [1, 100, 80], [2, 50, 32], [2, 50, 24], [4, 25, 9],
      // 5
      [1, 134, 108], [2, 67, 43], [2, 33, 15, 2, 34, 16], [2, 33, 11, 2, 34, 12],
      // 6
      [2, 86, 68], [4, 43, 27], [4, 43, 19], [4, 43, 15],
      // 7
      [2, 98, 78], [4, 49, 31], [2, 32, 14, 4, 33, 15], [4, 39, 13, 1, 40, 14],
      // 8
      [2, 121, 97], [2, 60, 38, 2, 61, 39], [4, 40, 18, 2, 41, 19], [4, 40, 14, 2, 41, 15],
      // 9
      [2, 146, 116], [3, 58, 36, 2, 59, 37], [4, 36, 16, 4, 37, 17], [4, 36, 12, 4, 37, 13],
      // 10
      [2, 86, 68, 2, 87, 69], [4, 69, 43, 1, 70, 44], [6, 43, 19, 2, 44, 20], [6, 43, 15, 2, 44, 16],
      // 11
      [4, 101, 81], [1, 80, 50, 4, 81, 51], [4, 50, 22, 4, 51, 23], [3, 36, 12, 8, 37, 13],
      // 12
      [2, 116, 92, 2, 117, 93], [6, 58, 36, 2, 59, 37], [4, 46, 20, 6, 47, 21], [7, 42, 14, 4, 43, 15],
      // 13
      [4, 133, 107], [8, 59, 37, 1, 60, 38], [8, 44, 20, 4, 45, 21], [12, 33, 11, 4, 34, 12],
      // 14
      [3, 145, 115, 1, 146, 116], [4, 64, 40, 5, 65, 41], [11, 36, 16, 5, 37, 17], [11, 36, 12, 5, 37, 13],
      // 15
      [5, 109, 87, 1, 110, 88], [5, 65, 41, 5, 66, 42], [5, 54, 24, 7, 55, 25], [11, 36, 12, 7, 37, 13],
      // 16
      [5, 122, 98, 1, 123, 99], [7, 73, 45, 3, 74, 46], [15, 43, 19, 2, 44, 20], [3, 45, 15, 13, 46, 16],
      // 17
      [1, 135, 107, 5, 136, 108], [10, 74, 46, 1, 75, 47], [1, 50, 22, 15, 51, 23], [2, 42, 14, 17, 43, 15],
      // 18
      [5, 150, 120, 1, 151, 121], [9, 69, 43, 4, 70, 44], [17, 50, 22, 1, 51, 23], [2, 42, 14, 19, 43, 15],
      // 19
      [3, 141, 113, 4, 142, 114], [3, 70, 44, 11, 71, 45], [17, 47, 21, 4, 48, 22], [9, 39, 13, 16, 40, 14],
      // 20
      [3, 135, 107, 5, 136, 108], [3, 67, 41, 13, 68, 42], [15, 54, 24, 5, 55, 25], [15, 43, 15, 10, 44, 16],
      // 21
      [4, 144, 116, 4, 145, 117], [17, 68, 42], [17, 50, 22, 6, 51, 23], [19, 46, 16, 6, 47, 17],
      // 22
      [2, 139, 111, 7, 140, 112], [17, 74, 46], [7, 54, 24, 16, 55, 25], [34, 37, 13],
      // 23
      [4, 151, 121, 5, 152, 122], [4, 75, 47, 14, 76, 48], [11, 54, 24, 14, 55, 25], [16, 45, 15, 14, 46, 16],
      // 24
      [6, 147, 117, 4, 148, 118], [6, 73, 45, 14, 74, 46], [11, 54, 24, 16, 55, 25], [30, 46, 16, 2, 47, 17],
      // 25
      [8, 132, 106, 4, 133, 107], [8, 75, 47, 13, 76, 48], [7, 54, 24, 22, 55, 25], [22, 45, 15, 13, 46, 16],
      // 26
      [10, 142, 114, 2, 143, 115], [19, 74, 46, 4, 75, 47], [28, 50, 22, 6, 51, 23], [33, 46, 16, 4, 47, 17],
      // 27
      [8, 152, 122, 4, 153, 123], [22, 73, 45, 3, 74, 46], [8, 53, 23, 26, 54, 24], [12, 45, 15, 28, 46, 16],
      // 28
      [3, 147, 117, 10, 148, 118], [3, 73, 45, 23, 74, 46], [4, 54, 24, 31, 55, 25], [11, 45, 15, 31, 46, 16],
      // 29
      [7, 146, 116, 7, 147, 117], [21, 73, 45, 7, 74, 46], [1, 53, 23, 37, 54, 24], [19, 45, 15, 26, 46, 16],
      // 30
      [5, 145, 115, 10, 146, 116], [19, 75, 47, 10, 76, 48], [15, 54, 24, 25, 55, 25], [23, 45, 15, 25, 46, 16],
      // 31
      [13, 145, 115, 3, 146, 116], [2, 74, 46, 29, 75, 47], [42, 54, 24, 1, 55, 25], [23, 45, 15, 28, 46, 16],
      // 32
      [17, 145, 115], [10, 74, 46, 23, 75, 47], [10, 54, 24, 35, 55, 25], [19, 45, 15, 35, 46, 16],
      // 33
      [17, 145, 115, 1, 146, 116], [14, 74, 46, 21, 75, 47], [29, 54, 24, 19, 55, 25], [11, 45, 15, 46, 46, 16],
      // 34
      [13, 145, 115, 6, 146, 116], [14, 74, 46, 23, 75, 47], [44, 54, 24, 7, 55, 25], [59, 46, 16, 1, 47, 17],
      // 35
      [12, 151, 121, 7, 152, 122], [12, 75, 47, 26, 76, 48], [39, 54, 24, 14, 55, 25], [22, 45, 15, 41, 46, 16],
      // 36
      [6, 151, 121, 14, 152, 122], [6, 75, 47, 34, 76, 48], [46, 54, 24, 10, 55, 25], [2, 45, 15, 64, 46, 16],
      // 37
      [17, 152, 122, 4, 153, 123], [29, 74, 46, 14, 75, 47], [49, 54, 24, 10, 55, 25], [24, 45, 15, 46, 46, 16],
      // 38
      [4, 152, 122, 18, 153, 123], [13, 74, 46, 32, 75, 47], [48, 54, 24, 14, 55, 25], [42, 45, 15, 32, 46, 16],
      // 39
      [20, 147, 117, 4, 148, 118], [40, 75, 47, 7, 76, 48], [43, 54, 24, 22, 55, 25], [10, 45, 15, 67, 46, 16],
      // 40
      [19, 148, 118, 6, 149, 119], [18, 75, 47, 31, 76, 48], [34, 54, 24, 34, 55, 25], [20, 45, 15, 61, 46, 16]
    ]

    return {
      getRSBlocks(typeNumber, errorCorrectLevel) {
        const rsBlockOffset = (typeNumber - 1) * 4 + errorCorrectLevel
        const rsBlock = RS_BLOCK_TABLE[rsBlockOffset]
        if (!rsBlock) {
          throw new Error('bad rs block @ typeNumber:' + typeNumber + '/errorCorrectLevel:' + errorCorrectLevel)
        }
        const length = rsBlock.length / 3
        const list = []
        for (let i = 0; i < length; i += 1) {
          const count = rsBlock[i * 3 + 0]
          const totalCount = rsBlock[i * 3 + 1]
          const dataCount = rsBlock[i * 3 + 2]
          for (let j = 0; j < count; j += 1) {
            list.push({
              totalCount,
              dataCount
            })
          }
        }
        return list
      }
    }
  })()

  function createBase64(width, height, getPixel) {
    const bytes = []
    bytes.push(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a) // PNG signature
    const writeChunk = (type, data) => {
      const length = data.length
      bytes.push((length >>> 24) & 0xff, (length >>> 16) & 0xff, (length >>> 8) & 0xff, length & 0xff)
      for (let i = 0; i < 4; i += 1) {
        bytes.push(type.charCodeAt(i))
      }
      bytes.push(...data)
      const crc = crc32(bytes.slice(bytes.length - data.length - 4))
      bytes.push((crc >>> 24) & 0xff, (crc >>> 16) & 0xff, (crc >>> 8) & 0xff, crc & 0xff)
    }

    const IHDR = []
    IHDR.push((width >>> 24) & 0xff, (width >>> 16) & 0xff, (width >>> 8) & 0xff, width & 0xff)
    IHDR.push((height >>> 24) & 0xff, (height >>> 16) & 0xff, (height >>> 8) & 0xff, height & 0xff)
    IHDR.push(8, 0, 0, 0, 0)
    writeChunk('IHDR', IHDR)

    const pixels = []
    for (let y = 0; y < height; y += 1) {
      pixels.push(0)
      for (let x = 0; x < width; x += 1) {
        const c = getPixel(x, y)
        pixels.push(c ? 0xff : 0x00)
      }
    }

    const compressed = zlibDeflate(pixels)
    writeChunk('IDAT', compressed)
    writeChunk('IEND', [])

    return `data:image/png;base64,${base64Encode(bytes)}`
  }

  function crc32(bytes) {
    let crc = -1
    for (let i = 0; i < bytes.length; i += 1) {
      crc = crc >>> 8 ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff]
    }
    return crc ^ -1
  }

  const CRC_TABLE = new Array(256)
  for (let i = 0; i < 256; i += 1) {
    let c = i
    for (let j = 0; j < 8; j += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    CRC_TABLE[i] = c >>> 0
  }

  function zlibDeflate(data) {
    const header = [0x78, 0x01]
    const blocks = []
    let pos = 0
    while (pos < data.length) {
      const blockSize = Math.min(0xffff, data.length - pos)
      const isLast = pos + blockSize >= data.length
      blocks.push(isLast ? 0x01 : 0x00)
      blocks.push(blockSize & 0xff, (blockSize >> 8) & 0xff)
      const nlen = (~blockSize) & 0xffff
      blocks.push(nlen & 0xff, (nlen >> 8) & 0xff)
      for (let i = 0; i < blockSize; i += 1) {
        blocks.push(data[pos + i])
      }
      pos += blockSize
    }
    const adler = adler32(data)
    blocks.push((adler >> 24) & 0xff, (adler >> 16) & 0xff, (adler >> 8) & 0xff, adler & 0xff)
    return header.concat(blocks)
  }

  function adler32(data) {
    let a = 1
    let b = 0
    const MOD_ADLER = 65521
    for (let i = 0; i < data.length; i += 1) {
      a = (a + data[i]) % MOD_ADLER
      b = (b + a) % MOD_ADLER
    }
    return (b << 16) | a
  }

  function base64Encode(bytes) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    let result = ''
    let i
    for (i = 0; i + 2 < bytes.length; i += 3) {
      result += chars[bytes[i] >> 2]
      result += chars[((bytes[i] & 0x03) << 4) | (bytes[i + 1] >> 4)]
      result += chars[((bytes[i + 1] & 0x0f) << 2) | (bytes[i + 2] >> 6)]
      result += chars[bytes[i + 2] & 0x3f]
    }
    if (i < bytes.length) {
      result += chars[bytes[i] >> 2]
      if (i === bytes.length - 1) {
        result += chars[(bytes[i] & 0x03) << 4]
        result += '=='
      } else {
        result += chars[((bytes[i] & 0x03) << 4) | (bytes[i + 1] >> 4)]
        result += chars[(bytes[i + 1] & 0x0f) << 2]
        result += '='
      }
    }
    return result
  }

  return qrcode
})()

export function generateQRCodeDataURL(text, options = {}) {
  const {
    size = 300,
    margin = 16,
    errorCorrectLevel = 'M'
  } = options

  const qr = qrcode(0, errorCorrectLevel)
  qr.addData(text)
  qr.make()
  const cellSize = Math.max(1, Math.floor((size - margin * 2) / qr.getModuleCount()))
  return qr.createDataURL(cellSize, Math.floor(margin / 2))
}

export default {
  generateQRCodeDataURL
}
