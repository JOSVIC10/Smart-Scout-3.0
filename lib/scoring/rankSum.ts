// ============================================================================
// Smart Scout 3.0 — Algoritmo Rank-Sum
// ============================================================================
// Convierte un orden de importancia (ranking) en pesos porcentuales
// automáticamente. Adaptación simplificada del AHP descrita en el TFM.
//
// Fórmula: peso_i = (n + 1 - rango_i) / Σ(n + 1 - j) para j=1..n
//
// Ejemplo con n=5 métricas ordenadas de 1 (más importante) a 5:
//   Rango 1 → peso = 5/15 = 0.3333
//   Rango 2 → peso = 4/15 = 0.2667
//   Rango 3 → peso = 3/15 = 0.2000
//   Rango 4 → peso = 2/15 = 0.1333
//   Rango 5 → peso = 1/15 = 0.0667
//                    Σ = 1.0000

/**
 * Calcula los pesos por Rank-Sum dado un número total de métricas.
 * @param n Número total de métricas en el ranking
 * @returns Array de pesos donde el índice 0 corresponde al rango 1 (más importante)
 */
export function calcularPesosRankSum(n: number): number[] {
  if (n <= 0) return []
  if (n === 1) return [1.0]

  // Denominador = Σ(n+1-j) para j=1..n = n*(n+1)/2
  const denominador = (n * (n + 1)) / 2
  const pesos: number[] = []

  for (let rango = 1; rango <= n; rango++) {
    pesos.push((n + 1 - rango) / denominador)
  }

  return pesos
}

/**
 * Dado un array de IDs de métricas ordenados por importancia (el primero es el más importante),
 * devuelve un Map de ID → { rango, peso }.
 */
export function generarPonderaciones(metricaIdsOrdenados: string[]): Map<string, { rango: number; peso: number }> {
  const pesos = calcularPesosRankSum(metricaIdsOrdenados.length)
  const resultado = new Map<string, { rango: number; peso: number }>()

  metricaIdsOrdenados.forEach((id, index) => {
    resultado.set(id, {
      rango: index + 1,
      peso: Math.round(pesos[index] * 10000) / 10000, // 4 decimales
    })
  })

  return resultado
}
