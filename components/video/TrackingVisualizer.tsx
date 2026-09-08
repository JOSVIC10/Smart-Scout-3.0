'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Play, Pause, FastForward, Users, Clock, MousePointerClick } from 'lucide-react'

interface Player {
  id: number
  team: number | null
  x: number
  y: number
  has_ball: boolean
}

interface Referee {
  id: number
  x: number
  y: number
}

interface TrackingFrame {
  frame: number
  players: Player[]
  referees: Referee[]
  ball: { x: number, y: number } | null
}

interface TrackingVisualizerProps {
  telemetry: {
    possession: Record<string, number>
    total_frames: number
    fps?: number
    tracking_data?: TrackingFrame[]
  }
}

export function TrackingVisualizer({ telemetry }: TrackingVisualizerProps) {
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  
  const fps = telemetry.fps || 24
  const trackingData = telemetry.tracking_data || []
  const totalFrames = trackingData.length > 0 ? trackingData.length : telemetry.total_frames
  
  // Ref for animation loop
  const requestRef = useRef<number | undefined>(undefined)
  const lastUpdateRef = useRef<number>(0)

  // Interval possession calculation (15 min chunks)
  const intervalPossession = useMemo(() => {
    if (!trackingData || trackingData.length === 0) return []
    
    // 15 mins in frames
    const framesPerInterval = 15 * 60 * fps
    const totalIntervals = Math.ceil(totalFrames / framesPerInterval)
    const intervals = []
    
    let currentPossession: number | null = null
    
    for (let i = 0; i < totalIntervals; i++) {
      const startFrame = i * framesPerInterval
      const endFrame = Math.min((i + 1) * framesPerInterval, totalFrames) - 1
      
      let team1Frames = 0
      let team2Frames = 0
      
      for (let f = startFrame; f <= endFrame; f++) {
        const frameData = trackingData[f]
        let framePossessingTeam = null
        
        if (frameData) {
          const playerWithBall = frameData.players.find(p => p.has_ball)
          if (playerWithBall && playerWithBall.team !== null) {
            framePossessingTeam = playerWithBall.team
            currentPossession = playerWithBall.team
          } else {
            framePossessingTeam = currentPossession
          }
        }
        
        // Coerce types just in case
        if (String(framePossessingTeam) === '1') team1Frames++
        if (String(framePossessingTeam) === '2') team2Frames++
      }
      
      const total = team1Frames + team2Frames
      intervals.push({
        label: `${i * 15}'-${(i + 1) * 15}'`,
        team1Pct: total > 0 ? (team1Frames / total) * 100 : 0,
        team2Pct: total > 0 ? (team2Frames / total) * 100 : 0
      })
    }
    return intervals
  }, [trackingData, fps, totalFrames])

  const frameData = trackingData[currentFrame] || { players: [], referees: [], ball: null }

  // Current possession logic
  const currentPlayerWithBall = frameData.players.find(p => p.has_ball)
  const currentPossessionTeam = currentPlayerWithBall?.team

  // Animation Loop
  const animate = (time: number) => {
    if (!lastUpdateRef.current) lastUpdateRef.current = time
    const deltaTime = time - lastUpdateRef.current
    
    // Time per frame in ms based on fps and speed
    const msPerFrame = (1000 / fps) / playbackSpeed

    if (deltaTime >= msPerFrame) {
      setCurrentFrame(prev => {
        if (prev >= totalFrames - 1) {
          setIsPlaying(false)
          return prev
        }
        return prev + 1
      })
      lastUpdateRef.current = time
    }
    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(animate)
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
      lastUpdateRef.current = 0
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [isPlaying, playbackSpeed, fps, totalFrames])

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentFrame(Number(e.target.value))
  }

  const togglePlayback = () => setIsPlaying(!isPlaying)
  
  const cycleSpeed = () => {
    setPlaybackSpeed(prev => {
      if (prev === 1) return 2
      if (prev === 2) return 4
      return 1
    })
  }

  const formatTime = (frames: number) => {
    const totalSeconds = Math.floor(frames / fps)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (!trackingData || trackingData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500 dark:text-slate-400">
          <p>No hay datos de tracking por frame (tracking_data) en el telemetry.json.</p>
          <p className="text-sm mt-2">Asegúrate de haber procesado el video con la versión más reciente del pipeline.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT: PITCH & CONTROLS */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative aspect-video bg-emerald-800 rounded-xl overflow-hidden shadow-inner border-2 border-emerald-900/50">
          <svg 
            viewBox="0 0 100 100" 
            preserveAspectRatio="none" 
            className="w-full h-full cursor-crosshair"
            onClick={() => setSelectedPlayer(null)} // Click on pitch clears selection
          >
            {/* Field Markings */}
            <g stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.5" fill="none">
              <rect x="0.5" y="0.5" width="99" height="99" />
              <line x1="50" y1="0" x2="50" y2="100" />
              <circle cx="50" cy="50" r="10" />
              <circle cx="50" cy="50" r="0.5" fill="rgba(255, 255, 255, 0.4)" />
              {/* Penalty areas */}
              <rect x="0" y="20" width="16" height="60" />
              <rect x="84" y="20" width="16" height="60" />
              {/* Goal areas */}
              <rect x="0" y="35" width="5" height="30" />
              <rect x="95" y="35" width="5" height="30" />
            </g>

            {/* Render Players */}
            {frameData.players.map(player => (
              <g 
                key={`player-${player.id}`}
                className="transition-all duration-75 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedPlayer(player)
                }}
              >
                {player.has_ball && (
                  <circle cx={player.x} cy={player.y} r="3" fill="rgba(255,255,0,0.3)" />
                )}
                <circle 
                  cx={player.x} 
                  cy={player.y} 
                  r={selectedPlayer?.id === player.id ? "2.5" : "1.8"}
                  fill={String(player.team) === '1' ? '#3b82f6' : String(player.team) === '2' ? '#ef4444' : '#6b7280'}
                  stroke={selectedPlayer?.id === player.id ? '#ffffff' : '#000000'}
                  strokeWidth="0.3"
                />
              </g>
            ))}

            {/* Render Referees */}
            {frameData.referees.map(ref => (
              <circle 
                key={`ref-${ref.id}`}
                cx={ref.x} 
                cy={ref.y} 
                r="1.8" 
                fill="#9ca3af" 
                stroke="#000000" 
                strokeWidth="0.3"
              />
            ))}

            {/* Render Ball */}
            {frameData.ball && (
              <circle 
                cx={frameData.ball.x} 
                cy={frameData.ball.y} 
                r="1" 
                fill="#ffffff" 
                stroke="#000000" 
                strokeWidth="0.5" 
              />
            )}
          </svg>
          
          {/* Selected Player Overlay Info */}
          {selectedPlayer && (
            <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl animate-in fade-in zoom-in-95 pointer-events-none">
              <p className="text-xs font-bold text-slate-300 uppercase mb-1 flex items-center gap-1">
                <MousePointerClick className="w-3 h-3" /> Player ID: {selectedPlayer.id}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400">
                <p>Team: <span className="text-slate-200 font-mono">{selectedPlayer.team || 'N/A'}</span></p>
                <p>Ball: <span className="text-slate-200 font-mono">{selectedPlayer.has_ball ? 'Yes' : 'No'}</span></p>
                <p>X: <span className="text-slate-200 font-mono">{selectedPlayer.x.toFixed(1)}%</span></p>
                <p>Y: <span className="text-slate-200 font-mono">{selectedPlayer.y.toFixed(1)}%</span></p>
              </div>
            </div>
          )}
        </div>

        {/* Timeline & Controls */}
        <div className="bg-white dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 shadow-xs">
          <Button 
            variant="secondary" 
            size="icon"
            onClick={togglePlayback}
            className="h-10 w-10 shrink-0 rounded-full"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
          </Button>

          <div className="flex-1 space-y-1">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span>{formatTime(currentFrame)}</span>
              <span>{formatTime(totalFrames)}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max={totalFrames - 1} 
              value={currentFrame}
              onChange={handleSliderChange}
              className="w-full accent-emerald-500 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={cycleSpeed}
            className="w-16 shrink-0 font-mono text-xs"
          >
            {playbackSpeed}x
          </Button>
        </div>
      </div>

      {/* RIGHT: STATS PANEL */}
      <div className="space-y-4">
        {/* Real-time Stats */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800/50">
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              Tiempo Real
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider">Balón en Frame</p>
              <div className="flex items-center gap-3">
                {currentPossessionTeam ? (
                  <div className={`px-3 py-1 rounded text-xs font-bold ${
                    String(currentPossessionTeam) === '1' ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800' : 'bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                  }`}>
                    Equipo {currentPossessionTeam}
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Disputa / Libre
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 uppercase font-bold tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3" /> Jugadores Detectados
              </p>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-200">
                {frameData.players.length} <span className="text-sm font-normal text-slate-500">+ {frameData.referees.length} Árbitros</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Global Possession Summary */}
        <Card>
          <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800/50">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-900 dark:text-slate-200">
              Posesión Global
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex h-3 w-full rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800">
              <div 
                className="bg-blue-500 transition-all duration-500" 
                style={{ width: `${telemetry.possession?.['1'] || 0}%` }}
              />
              <div 
                className="bg-red-500 transition-all duration-500" 
                style={{ width: `${telemetry.possession?.['2'] || 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs font-bold">
              <span className="text-blue-600 dark:text-blue-400">Local {(telemetry.possession?.['1'] || 0).toFixed(1)}%</span>
              <span className="text-red-600 dark:text-red-400">Visitante {(telemetry.possession?.['2'] || 0).toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Interval Possession */}
        {intervalPossession.length > 0 && (
          <Card>
            <CardHeader className="pb-3 border-b border-slate-200 dark:border-slate-800/50">
              <CardTitle className="text-sm text-slate-900 dark:text-slate-200">
                Evolución (Intervalos 15')
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {intervalPossession.map((interval, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>{interval.label}</span>
                    <span>{interval.team1Pct.toFixed(0)}% - {interval.team2Pct.toFixed(0)}%</span>
                  </div>
                  <div className="flex h-1.5 w-full rounded-full overflow-hidden bg-slate-800">
                    <div 
                      className="bg-blue-500 transition-all duration-500" 
                      style={{ width: `${interval.team1Pct}%` }}
                    />
                    <div 
                      className="bg-red-500 transition-all duration-500" 
                      style={{ width: `${interval.team2Pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
