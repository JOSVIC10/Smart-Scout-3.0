'use client'

import React, { useCallback, useEffect, useState } from 'react'
import ReactPlayer from 'react-player'

export interface VideoPlayerRef {
  currentTime: number
}

interface CustomVideoPlayerProps {
  url: string
  playerRef: React.MutableRefObject<any>
  onProgress: (state: { playedSeconds: number; played: number }) => void
  onDuration?: (duration: number) => void
  onReady?: () => void
  playing?: boolean
  onPlayPause?: (playing: boolean) => void
}

export function CustomVideoPlayer({
  url,
  playerRef,
  onProgress,
  onDuration,
  onReady,
  playing,
  onPlayPause,
}: CustomVideoPlayerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePlay = useCallback(() => {
    onPlayPause?.(true)
  }, [onPlayPause])

  const handlePause = useCallback(() => {
    onPlayPause?.(false)
  }, [onPlayPause])

  const handleTimeUpdate = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.currentTarget
    onProgress?.({
      playedSeconds: target.currentTime,
      played: target.duration ? target.currentTime / target.duration : 0,
    })
  }, [onProgress])

  const handleDurationChange = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const target = e.currentTarget
    onDuration?.(target.duration)
  }, [onDuration])

  if (!mounted) {
    return null
  }

  return (
    <ReactPlayer
      ref={playerRef}
      src={url}
      width="100%"
      height="100%"
      controls
      playing={playing}
      onTimeUpdate={handleTimeUpdate}
      onDurationChange={handleDurationChange}
      onCanPlay={onReady}
      onPlay={handlePlay}
      onPause={handlePause}
      onError={() => console.warn('[ReactPlayer] Error de media al cargar el vídeo (no crítico)')}
      config={({
        youtube: {
          playerVars: {
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
          },
        },
        file: {
          attributes: {
            controlsList: 'nodownload',
            style: { objectFit: 'contain', width: '100%', height: '100%' },
          },
        },
      }) as any}
    />
  )
}
