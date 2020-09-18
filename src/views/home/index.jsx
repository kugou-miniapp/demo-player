import React, {useEffect, useState} from 'react';
import NavigationBar from '@/components/navigation-bar'
import './index.scss'
import player from '@/hooks/player'
import logo from '@/assets/img/logo.png'

export default function Home() {
  const [data, setData] = useState('')
  // 播放器
  const MiniPlayer = player()
  // 歌曲信息
  const playingSong = MiniPlayer.playingSongInfo || {}
  // 通过id获取歌曲信息
  const getSongs = (ids, cb) => {
    window.MiniApp && window.MiniApp.getSongs({
      album_audio_ids: ids,
      success(res) {
        if (res && res.song_data_list && Array.isArray(res.song_data_list)) {
          cb && cb(res.song_data_list)
        }
      }
    })
  }

  useEffect(() => {
    // 初始化播放器
    MiniPlayer.playerInit()
    // 获取歌曲信息
    getSongs([125641108, 63521925, 252060937, 108961364], (songs) => {
      setData(songs)
    })
  }, [])

  useEffect(() => {
    if (data && data.length > 0) {
      // 设置播放数据
      MiniPlayer.playerSetData(0, data, () => {
        // 播放
        MiniPlayer.onPlayerPlay()
      })
    }
  }, [data.length])

  return (
    <section className='home'>
      <NavigationBar title='播放器Demo'/>
      <div className='container'>
        <div className='stand2'></div>
        {/* 封面 */}
        <div className='cover'>
          <img src={playingSong && playingSong.album_sizable_cover ? playingSong.album_sizable_cover.replace('{size}', 400) : logo} alt="cover"/>
        </div>
        {/* 歌曲信息 */}
        <div className='info'>
          <div className='audio-name'>{playingSong && playingSong.audio_name ? playingSong.audio_name : ''}</div>
          <div className='author-name'>{playingSong && playingSong.author_name ? playingSong.author_name : ''}</div>
        </div>
        {/* 进度条 */}
        <div className='bar'>
          <div className='progressWrap'>
            <div className='currentTime'>{MiniPlayer.showCurrentTime}</div>
            <div className='progress'>
              <div 
                className='progressBar'
                style={{width: `${MiniPlayer.showCurrentProgress}%`}}
              ></div>
              <div className='progressBall'>
                <div className='progressBallBar'></div>
              </div>
            </div>
            <div className='endTime'>{MiniPlayer.showEndTime}</div>
          </div>
        </div>
        {/* 播放器控制台 */}
        <div className='player'>
          {/* 上一首 */}
          <div 
            className='prev'
            onClick={MiniPlayer.onPlayerPre}
          >
            <img src='https://webimg.kgimg.com/774fb1d7e6dc7ee6ed5d65ad7e73f2f7.png' alt='btn'/>
          </div>
          {/* 播放或者暂停 */}
          <div 
            className='play'
            onClick={MiniPlayer.onPlayerPlay}
          >
            <img src={MiniPlayer.isPlay ? 'https://webimg.kgimg.com/ca9f5825b8825cccb4f6a5f1ccadf90b.png' : 'https://webimg.kgimg.com/24b157d34dc9a68982f7827cb78dd17b.png'} alt='play'/>
          </div>
          {/* 下一首 */}
          <div 
            className='next'
            onClick={MiniPlayer.onPlayerNext}
          >
            <img src='https://webimg.kgimg.com/48db6a3c3aad1d636aea0ba1fe74880c.png' alt='btn'/>
          </div>
        </div>
        <div className='stand1'></div>
      </div>
    </section>
  )
}
