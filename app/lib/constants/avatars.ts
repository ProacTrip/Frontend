/**
 * Lista de avatares disponibles (emojis)
 * Más adelante se reemplazarán por URLs de imágenes del backend
 */
export const AVATARS = [
  '😎', // Cara con gafas de sol
  '🤠', // Cara de cowboy
  '🥳', // Cara de fiesta
  '🤓', // Cara de nerd
  '😇', // Cara de ángel
  '🦸', // Superhéroe
  '🧙', // Mago
  '🧛', // Vampiro
  '🧝', // Elfo
  '🧞', // Genio
  '🐱', // Gato
  '🐶', // Perro
  '🐼', // Panda
  '🦊', // Zorro
  '🦁', // León
  '🚀', // Cohete
  '✈️', // Avión
  '🏖️', // Playa
  '🗺️', // Mapa
  '🎒', // Mochila
];

/**
 * Avatar por defecto si el usuario no ha seleccionado ninguno
 */
export const DEFAULT_AVATAR = '😎';

/**
 * Verifica si un avatar es válido
 */
export function isValidAvatar(avatar: string): boolean {
  return AVATARS.includes(avatar);
}