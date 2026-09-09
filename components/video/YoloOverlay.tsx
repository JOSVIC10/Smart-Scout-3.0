import React from 'react'
import { YoloData } from './useYoloMock'

interface YoloOverlayProps {
  data: YoloData | null
  showTracking: boolean
  showPasses: boolean
  showNames: boolean
}

export function YoloOverlay({ data, showTracking, showPasses, showNames }: YoloOverlayProps) {
  if (!data) return null

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <svg width="100%" height="100%" className="absolute inset-0">
        {/* Render Passes */}
        {showPasses && data.passes.map((pass, i) => {
          const fromPlayer = data.players.find(p => p.id === pass.fromId)
          const toPlayer = data.players.find(p => p.id === pass.toId)
          
          if (!fromPlayer || !toPlayer) return null

          // Color based on status
          const strokeColor = pass.status === 'open' ? 'rgba(52, 211, 153, 0.6)' // emerald
                            : pass.status === 'screened' ? 'rgba(251, 191, 36, 0.6)' // amber
                            : 'rgba(239, 68, 68, 0.6)' // red

          return (
            <g key={`pass-${i}`}>
              <line
                x1={`${fromPlayer.x * 100}%`}
                y1={`${fromPlayer.y * 100}%`}
                x2={`${toPlayer.x * 100}%`}
                y2={`${toPlayer.y * 100}%`}
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray="4 4"
                className="animate-pulse"
              />
              {/* Pass Probability Label */}
              <text
                x={`${(fromPlayer.x + toPlayer.x) / 2 * 100}%`}
                y={`${(fromPlayer.y + toPlayer.y) / 2 * 100}%`}
                fill="white"
                fontSize="10"
                fontWeight="bold"
                textAnchor="middle"
                className="drop-shadow-md"
              >
                {pass.probability.toFixed(0)}%
              </text>
            </g>
          )
        })}

        {/* Render Players */}
        {showTracking && data.players.map(player => {
          const isHome = player.team === 'home'
          const boxColor = isHome ? '#3b82f6' : '#ef4444' // blue or red
          
          return (
            <g key={player.id} className="transition-all duration-100 ease-linear">
              {/* Bounding Box (simulated with a circle for now as we only have center x,y, or we can draw a rect around x,y) */}
              <rect
                x={`${player.x * 100 - 1.5}%`}
                y={`${player.y * 100 - 3}%`}
                width="3%"
                height="6%"
                fill="transparent"
                stroke={boxColor}
                strokeWidth="1.5"
                rx="2"
              />
              
              {/* Player ID / Number Box below bounding box */}
              <rect
                x={`${player.x * 100 - 1.5}%`}
                y={`${player.y * 100 + 3}%`}
                width="3%"
                height="2%"
                fill={boxColor}
                opacity="0.8"
                rx="1"
              />
              <text
                x={`${player.x * 100}%`}
                y={`${player.y * 100 + 4.5}%`}
                fill="white"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {player.number || player.id}
              </text>

              {/* Player Name Overlay */}
              {showNames && player.name && (
                <text
                  x={`${player.x * 100}%`}
                  y={`${player.y * 100 - 4}%`}
                  fill="white"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor="middle"
                  className="drop-shadow-lg"
                  style={{ textShadow: '1px 1px 2px black' }}
                >
                  {player.name}
                </text>
              )}
            </g>
          )
        })}

        {/* Render Ball */}
        {showTracking && data.ball && (
          <g>
            <circle
              cx={`${data.ball.x * 100}%`}
              cy={`${data.ball.y * 100}%`}
              r="4"
              fill="white"
              stroke="black"
              strokeWidth="1"
            />
            {/* Ball Speed Vector/Label */}
            <text
              x={`${data.ball.x * 100 + 1}%`}
              y={`${data.ball.y * 100 - 1}%`}
              fill="#fbbf24"
              fontSize="9"
              fontWeight="bold"
              style={{ textShadow: '1px 1px 1px black' }}
            >
              {data.ball.speed}km/h
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
