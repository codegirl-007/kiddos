import React from 'react';
import { VideoApp } from '../pages/VideoApp';
import { SpeechSoundsApp } from '../pages/SpeechSoundsApp';

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
    name: 'Video Library',
    description: 'Browse long-form videos from your trusted kid-friendly channels, already filtered to longer than ten minutes.',
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
  }
];
