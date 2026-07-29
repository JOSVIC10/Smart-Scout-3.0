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

  const handleProgress = useCallback((state: { playedSeconds: number; played: number }) => {
    onProgress?.(state)
  }, [onProgress])

  const handleDurationChange = useCallback((duration: number) => {
    onDuration?.(duration)
  }, [onDuration])

  if (!mounted) {
    return null
  }

  const safeUrl = typeof url === 'string' ? url.trim() : url

  return (
    <ReactPlayer
      ref={playerRef}
      url={safeUrl}
      width="100%"
      height="100%"
      controls={true}
      playing={playing}
      onProgress={handleProgress}
      onDurationChange={handleDurationChange}
      onReady={onReady}
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
