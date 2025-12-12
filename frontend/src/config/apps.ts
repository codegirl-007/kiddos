import React, { lazy } from 'react';

// Lazy load game pages for code splitting
const VideoApp = lazy(() => import('../pages/VideoApp').then(module => ({ default: module.VideoApp })));
const SpeechSoundsApp = lazy(() => import('../pages/SpeechSoundsApp').then(module => ({ default: module.SpeechSoundsApp })));
const TicTacToeApp = lazy(() => import('../pages/TicTacToeApp').then(module => ({ default: module.TicTacToeApp })));
const DrawingPadApp = lazy(() => import('../pages/DrawingPadApp').then(module => ({ default: module.DrawingPadApp })));

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
  },
  {
    id: 'drawingpad',
    name: 'Drawing Pad',
    description: 'Draw and create your own artwork!',
    cta: 'Start Drawing',
    link: '/drawing-pad',
    disabled: false,
    component: DrawingPadApp
  }
];
