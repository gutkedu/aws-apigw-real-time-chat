/**
 * Generate a unique username based on connection ID
 * @param connectionId The WebSocket connection ID
 * @returns A deterministic but friendly username
 */
export function genSenderFromConnId(connectionId: string): string {
  // Use the first 8 chars of the connection ID to seed our selection
  const seed = connectionId
    .slice(0, 8)
    .split('')
    .reduce((acc, char) => {
      return acc + char.charCodeAt(0)
    }, 0)

  const adjectives = [
    'Happy',
    'Lucky',
    'Sunny',
    'Clever',
    'Swift',
    'Brave',
    'Bright',
    'Wild',
    'Silent',
    'Calm',
    'Gentle',
    'Mighty',
    'Noble',
    'Proud',
    'Wise'
  ]

  const animals = [
    'Panda',
    'Tiger',
    'Dolphin',
    'Eagle',
    'Wolf',
    'Fox',
    'Owl',
    'Koala',
    'Lion',
    'Bear',
    'Hawk',
    'Deer',
    'Otter',
    'Seal',
    'Duck'
  ]

  // Use the seed to deterministically select adjective and animal
  const adjectiveIndex = seed % adjectives.length
  const animalIndex = Math.floor(seed / 100) % animals.length

  // Use the last 3 chars of connection ID for a number suffix
  const numberSuffix = connectionId.slice(-3).replace(/[^0-9]/g, '')
  const finalNumberSuffix = numberSuffix.length > 0 ? numberSuffix : (seed % 100).toString().padStart(2, '0')

  // Combine to form username
  return `${adjectives[adjectiveIndex]}${animals[animalIndex]}${finalNumberSuffix}`
}
