import React from 'react';
import { VideoApp } from '../pages/VideoApp';
import { SpeechSoundsApp } from '../pages/SpeechSoundsApp';
import { TicTacToeApp } from '../pages/TicTacToeApp';

export type App = {
  id: string;
  name: string;
  description: string;
  cta: string;
  link: string;
} & (
  | { disabled: true; component?: never }
  | { disabled?: false; component: React.ComponentType }
);

export const APPS: App[] = [
  {
    id: 'videos',
    name: 'Watch Videos',
    description: 'Browse long-form videos from your trusted kid-friendly channels.',
    cta: 'Open Videos',
    link: '/videos',
    component: VideoApp
  },
  {
    id: 'speechsounds',
    name: 'Speech Sounds',
    description: 'Practice speech sounds with word groups and track your progress.',
    cta: 'Start Practicing',
    link: '/speech-sounds',
    disabled: false,
    component: SpeechSoundsApp
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    description: 'Play multiplayer tic-tac-toe with friends!',
    cta: 'Play Now',
    link: '/tic-tac-toe',
    disabled: false,
    component: TicTacToeApp
  }
];
