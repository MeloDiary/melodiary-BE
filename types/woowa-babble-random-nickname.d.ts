// src/types/woowa-babble-random-nickname.d.ts

declare module '@woowa-babble/random-nickname' {
  export function getRandomNickname(
    type: 'animals' | 'heroes' | 'characters' | 'monsters'
  ): string;
}
