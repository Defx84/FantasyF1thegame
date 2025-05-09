declare module 'react-card-flip' {
  import { Component, ReactNode } from 'react';

  interface ReactCardFlipProps {
    isFlipped: boolean;
    flipDirection?: 'horizontal' | 'vertical';
    flipSpeedBackToFront?: number;
    flipSpeedFrontToBack?: number;
    infinite?: boolean;
    children: [ReactNode, ReactNode];
  }

  export default class ReactCardFlip extends Component<ReactCardFlipProps> {}
} 