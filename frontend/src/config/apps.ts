import React from 'react';
import { VideoApp } from '../pages/VideoApp';

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
    id: 'storytime',
    name: 'Story Time (Coming Soon)',
    description: 'Narrated stories and audio adventures for quiet time.',
    cta: 'In Development',
    link: '/stories',
    disabled: true
  }
];
