import { useState, useEffect, useRef } from 'react'

export interface YoloPlayer {
  id: number
  team: 'home' | 'away'
  x: number // 0 to 1 (relative to video width)
  y: number // 0 to 1 (relative to video height)
  vx: number
  vy: number
  name?: string
  number?: number
  hasBall?: boolean
}

export interface YoloPass {
  fromId: number
  toId: number
  probability: number // 0 to 100
  distance: number // meters
  status: 'open' | 'screened' | 'blocked'
}

export interface YoloData {
  players: YoloPlayer[]
  ball: { x: number; y: number; speed: number; inAir: boolean } | null
  passes: YoloPass[]
  stats: {
    possessionHome: number
    possessionAway: number
    pressureHome: number
    pressureAway: number
    spaceControlHome: number
    spaceControlAway: number
    phase: string
  }
}

// Generates an initial distribution of players (like a 4-4-2 or 4-3-3 formation)
const generateInitialPlayers = (): YoloPlayer[] => {
  const players: YoloPlayer[] = []
  
  // Home Team (e.g., Blue, moving right)
  const homeFormation = [
    { x: 0.1, y: 0.5, name: 'GK', number: 1 },
    { x: 0.25, y: 0.2, name: 'RB', number: 2 },
    { x: 0.2, y: 0.4, name: 'CB', number: 4 },
    { x: 0.2, y: 0.6, name: 'CB', number: 5 },
    { x: 0.25, y: 0.8, name: 'LB', number: 3 },
    { x: 0.4, y: 0.3, name: 'RM', number: 7 },
    { x: 0.35, y: 0.45, name: 'CM', number: 8 },
    { x: 0.35, y: 0.55, name: 'CM', number: 6 },
    { x: 0.4, y: 0.7, name: 'LM', number: 11 },
    { x: 0.55, y: 0.4, name: 'ST', number: 9 },
    { x: 0.55, y: 0.6, name: 'ST', number: 10 },
  ]
  
  // Away Team (e.g., Red, moving left)
  const awayFormation = [
    { x: 0.9, y: 0.5, name: 'GK', number: 1 },
    { x: 0.75, y: 0.2, name: 'LB', number: 3 },
    { x: 0.8, y: 0.4, name: 'CB', number: 4 },
    { x: 0.8, y: 0.6, name: 'CB', number: 5 },
    { x: 0.75, y: 0.8, name: 'RB', number: 2 },
    { x: 0.6, y: 0.3, name: 'LM', number: 11 },
    { x: 0.65, y: 0.45, name: 'CM', number: 8 },
    { x: 0.65, y: 0.55, name: 'CM', number: 6 },
    { x: 0.6, y: 0.7, name: 'RM', number: 7 },
    { x: 0.45, y: 0.4, name: 'ST', number: 9 },
    { x: 0.45, y: 0.6, name: 'ST', number: 10 },
  ]

  let id = 1
  homeFormation.forEach((p) => {
    players.push({
      id: id++,
      team: 'home',
      x: p.x,
      y: p.y,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      name: p.name,
      number: p.number,
      hasBall: p.number === 8, // Give ball to home CM initially
    })
  })
  
  awayFormation.forEach((p) => {
    players.push({
      id: id++,
      team: 'away',
      x: p.x,
      y: p.y,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05,
      name: p.name,
      number: p.number,
      hasBall: false,
    })
  })

  return players
}

// Adding noise to simulate movement
const updatePlayers = (players: YoloPlayer[], timeDelta: number, ballPos: { x: number, y: number }): YoloPlayer[] => {
  return players.map((p) => {
    // Add random wandering
    let newVx = p.vx + (Math.random() - 0.5) * 0.02
    let newVy = p.vy + (Math.random() - 0.5) * 0.02
    
    // Slight attraction to ball if close, or just generic clustering
    const distToBall = Math.hypot(p.x - ballPos.x, p.y - ballPos.y)
    if (distToBall < 0.2 && !p.hasBall) {
      newVx += (ballPos.x - p.x) * 0.05
      newVy += (ballPos.y - p.y) * 0.05
    }

    // Dampen velocity
    newVx *= 0.95
    newVy *= 0.95

    let newX = p.x + newVx * timeDelta
    let newY = p.y + newVy * timeDelta

    // Keep within bounds (padding for camera view)
    newX = Math.max(0.05, Math.min(0.95, newX))
    newY = Math.max(0.1, Math.min(0.9, newY))

    return { ...p, x: newX, y: newY, vx: newVx, vy: newVy }
  })
}

export function useYoloMock(isActive: boolean, playedSeconds: number): YoloData | null {
  const [data, setData] = useState<YoloData | null>(null)
  const playersRef = useRef<YoloPlayer[]>([])
  const lastTimeRef = useRef<number>(playedSeconds)
  
  useEffect(() => {
    if (!isActive) {
      setData(null)
      return
    }

    if (playersRef.current.length === 0) {
      playersRef.current = generateInitialPlayers()
    }

    // Mock an update loop synced to video time
    const timeDelta = Math.max(0, playedSeconds - lastTimeRef.current)
    if (timeDelta > 0.05) { // update at max ~20hz based on video progress
      lastTimeRef.current = playedSeconds
      
      const currentPlayers = playersRef.current
      let ballCarrier = currentPlayers.find(p => p.hasBall)
      
      // Randomly change possession occasionally
      if (Math.random() < 0.005 && ballCarrier) {
        ballCarrier.hasBall = false
        const potentialReceivers = currentPlayers.filter(p => p.team === ballCarrier?.team && p.id !== ballCarrier?.id)
        if (potentialReceivers.length > 0) {
           const newCarrier = potentialReceivers[Math.floor(Math.random() * potentialReceivers.length)]
           newCarrier.hasBall = true
           ballCarrier = newCarrier
        }
      }

      const ballPos = ballCarrier ? { x: ballCarrier.x, y: ballCarrier.y } : { x: 0.5, y: 0.5 }
      
      // Update positions
      const updatedPlayers = updatePlayers(currentPlayers, timeDelta, ballPos)
      playersRef.current = updatedPlayers

      // Generate passes from ball carrier
      const passes: YoloPass[] = []
      if (ballCarrier) {
        const teammates = updatedPlayers.filter(p => p.team === ballCarrier!.team && p.id !== ballCarrier!.id)
        // Find 2 best passing options
        teammates.sort((a, b) => Math.hypot(a.x - ballCarrier!.x, a.y - ballCarrier!.y) - Math.hypot(b.x - ballCarrier!.x, b.y - ballCarrier!.y))
        
        teammates.slice(0, 3).forEach((mate, index) => {
          const dist = Math.hypot(mate.x - ballCarrier!.x, mate.y - ballCarrier!.y) * 100 // roughly meters in this scale
          passes.push({
            fromId: ballCarrier!.id,
            toId: mate.id,
            probability: Math.max(30, 100 - dist * 1.5 - (index * 15)),
            distance: parseFloat(dist.toFixed(1)),
            status: index === 0 ? 'open' : (index === 1 ? 'screened' : 'blocked')
          })
        })
      }

      // Mock stats
      const isHomePos = ballCarrier?.team === 'home'
      
      setData({
        players: updatedPlayers,
        ball: { x: ballPos.x, y: ballPos.y, speed: ballCarrier ? 15 : 25, inAir: false },
        passes,
        stats: {
          possessionHome: isHomePos ? 62.4 : 62.2, // Simulate slowly shifting stats
          possessionAway: isHomePos ? 37.6 : 37.8,
          pressureHome: isHomePos ? 12 : 45,
          pressureAway: isHomePos ? 58 : 15,
          spaceControlHome: 55.2,
          spaceControlAway: 44.8,
          phase: isHomePos ? 'Ataque Posicional' : 'Transición Defensiva'
        }
      })
    } else if (timeDelta < 0) {
      // Seek backwards happened
      lastTimeRef.current = playedSeconds
    }

  }, [isActive, playedSeconds])

  return data
}
