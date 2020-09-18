import { useState, useRef, useEffect } from "react"
import loadingHandle from "@/utils/loadingHandle"

const MiniApp = window.MiniApp

// 获取album_audio_id，设置播放器歌曲参数
const fixIds = (songs) => {
  if (!songs || (songs && !Array.isArray(songs))) {
    console.log('songs 格式错误')
    return
  }

  let ids = []
  for(let song of songs) {
    if (song && song.album_audio_id) ids.push(song.album_audio_id)
  }
  return ids
}
// 统一错误提示
const requestError = (err) => {
  if (err) {
    if (err.errCode === 40100) {
      loadingHandle(false)
      MiniApp.showToast({title: err.errMsg, icon: 'error', duration: 1000})
    }
  }
}
// 整理时间
const fixPlayShowTime = (time) => {
  let allTimeM
  let allTimeS
  allTimeM = Math.floor(Math.floor(time / 1000) / 60)
  allTimeS = Math.floor(time / 1000) % 60
  return allTimeM + ':' + (allTimeS > 9 ? allTimeS : '0' + allTimeS)
}
// 暂停或者退出时，清除时间定时器
const clearTimer = (timer) => {
  const id = window[timer]
  if (id) {
    clearInterval(id)
    id = null
  }
}

const Player = () => {
  // 播放器数据
  const [dataPlayer, setDataPlayerFix] = useState([])
  let dataPlayerRef = useRef([])
  const setDataPlayer = (dataPlayer) => {
    setDataPlayerFix(dataPlayer)
    dataPlayerRef.current = dataPlayer
  }
  // 播放器歌曲下标
  const [indexPlayer, setIndexPlayerFix] = useState(0)
  let indexPlayerRef = useRef(0)
  const setIndexPlayer = (indexPlayer) => {
    setIndexPlayerFix(indexPlayer)
    indexPlayerRef.current = indexPlayer
  }
  // 是否播放
  const [isPlay, setIsPlayFix] = useState(false)
  const isPlayRef = useRef(false)
  const setIsPlay = (isPlay) => {
    setIsPlayFix(isPlay)
    isPlayRef.current = isPlay
  }
  // 记录播放歌曲时长（精确毫秒）
  const [durationTime, setDurationTime] = useState(0)
  // 记录当前播放时长（精确秒）
  const [currentTime, setCurrentTime] = useState(0)
  // 播放器是否设置了数据
  let isSetData = useRef(false)
  // 播放器是否开启
  const [isStart, setIsStart] = useState(false)

  useEffect(() => {
    if (!isStart) {
      setCurrentTime(0)
    }

    return () => {
      clearTimer(window.PlayerTimer)
    }
  }, [isStart])

  // 初始化播放器
  const playerInit = () => {
    if (!window.MusicPlayer) {
      window.MusicPlayer = MiniApp && MiniApp.createMusicPlayer({isInner: true})
    }
  }

  // 存储歌曲数据，用于调用播放器SDK播放
  const playerSetData = (index, data, cb) => {
    if (!data) {
      console.log('缺少设置播放器的数据')
      return 
    }

    clearTimer(window.PlayerTimer)

    isSetData.current = false
    setDataPlayer(data)
    setIndexPlayer(index)
    setCurrentTime(0)
    countDown.update(data)
    cb && cb()
  }

  // 调用播放器SDK，设置播放器数据并且播放
  const _setData = (index, data) => {
    countDown.update(data)
    // 整理id参数
    const ids = fixIds(data)
    window.MusicPlayer && window.MusicPlayer.setData({
      album_audio_ids: ids,
      index,
      ischeck: false,
      success: function (res) {
        isSetData.current = true
        loadingHandle(false)
        countDown.run(data)
      },
      fail: function (err) {
        if (err.errCode === 40100) {
          isSetData.current = true
          setCurrentTime(0)
        } else {}
        
        loadingHandle(false)
        if (err) requestError(err)
      }
    })
  }

  // 上一首
  const onPlayerPre = () => {
    if (isSetData.current) {
      if(!window.PlayerTimer) {
        countDown.run(dataPlayerRef.current)
      }

      // 加载中提示
      window.MiniApp && window.MiniApp.showLoading({ title: "加载中" })
      setTimeout(() => { 
        window.MiniApp && window.MiniApp.hideLoading()
      }, 500)
      
      // 播放器SDK，播放上一首
      window.MusicPlayer && window.MusicPlayer.playPrevious()
    }
  }

  // 下一首
  const onPlayerNext = () => {
    if (isSetData.current) {
      if(!window.PlayerTimer) {
        countDown.run(dataPlayerRef.current)
      }

      // 加载中提示
      window.MiniApp && window.MiniApp.showLoading({ title: "加载中" })
      setTimeout(() => {
        window.MiniApp && window.MiniApp.hideLoading()
      }, 500)

      // 播放器SDK，播放下一首
      window.MusicPlayer && window.MusicPlayer.playNext() 
    }
  }

  // 播放或者暂停按钮
  const onPlayerPlay = (is = isPlay) => {
    // 无播放数据时
    if (!dataPlayerRef.current || (dataPlayerRef.current && dataPlayerRef.current.length === 0)) return 
    
    setIsStart(true)
    // 是否已经设置播放器数据
    if (isSetData.current) {
      if (is) {
        // 播放器SDK，暂停
        window.MusicPlayer && window.MusicPlayer.pause()
        clearTimer(window.PlayerTimer)
        setIsPlay(false)
      } else {
        // 播放器SDK，播放
        window.MusicPlayer && window.MusicPlayer.play()
        setIsPlay(true)
        countDown.run(dataPlayerRef.current)
      }
    } else {
      loadingHandle(true)
      // 设置播放数据
      _setData(indexPlayerRef.current, dataPlayerRef.current)
    }
  }

  // 播放中
  const countDown = {
    run: function (items) { 
      let t = currentTime
  
      if (!window.PlayerTimer) {
        window.PlayerTimer = setInterval(() => {
          // 当前播放器播放的歌曲信息
          const playInfo = window.MusicPlayer && window.MusicPlayer.info
          // 当前播放时间
          const _currentTime = playInfo && playInfo.currentTime
          t = Math.floor(_currentTime)

          // 更新当前播放歌曲信息
          items.forEach((v, k) => {
            if (v.album_audio_id === (playInfo && playInfo.currentMixId)) {
              setIndexPlayer(k)
              setDurationTime(v.duration || (v.audio_info && v.audio_info.duration))
            }
          })
          
          setIsPlay(playInfo.playStatus === 'play' ? true : false)
          // 设置当前播放时间
          setCurrentTime(t)
          t += 1
        }, 500)
      }
    },
    update: function (items) { 
      const item = items[indexPlayerRef.current]
      if (!item) return 
      
      // 当前播放时间
      const _durationTime = item.audio_info && item.audio_info.duration ? Number(item.audio_info.duration) : 0
      let t = currentTime
      
      // 更新当前播放时间
      if (t >= _durationTime / 1000) {
        setCurrentTime(0)
      } else {
        setCurrentTime(t)
      }

      // 更新歌曲播放总时长
      setDurationTime(item.duration || (item.audio_info && item.audio_info.duration))
    }
  }

  return {
    dataPlayer,
    playingSongInfo: dataPlayer[indexPlayer],
    showCurrentTime: fixPlayShowTime(currentTime * 1000),
    showEndTime: fixPlayShowTime(durationTime),
    showCurrentProgress: Math.round(currentTime / (durationTime / 1000) * 100),
    isPlay,
    playerInit,
    playerSetData,
    onPlayerPre,
    onPlayerNext,
    onPlayerPlay,
  }
}

export default Player