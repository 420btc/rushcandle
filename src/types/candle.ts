export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
}

export interface CandlePattern {
  id: string;
  name: string;
  description: string;
  image: string;
  difficulty: number;
}

export type Prediction = 'bull' | 'bear' | null;
