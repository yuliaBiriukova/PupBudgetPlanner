import { createContext, useContext } from 'react';
import type { Jar, Move } from './jars';

export interface JarWorld {
  jars: Jar[];
  moves: Move[];
  /** Puts money in (positive) or takes it out (negative). */
  move: (
    jarId: string,
    accountId: string,
    amount: number,
    note?: string,
    accountAmount?: number,
  ) => void;
  addJar: (jar: Jar) => void;
  updateJar: (jar: Jar) => void;
  closeJar: (jarId: string) => void;
  /** This month's plan per jar (F-033's Budget): what the person means to set aside. */
  plan: Record<string, number>;
  setPlan: (jarId: string, amount: number | null) => void;
  /** The jar whose bar just changed: its one moment of motion. */
  fresh?: string;
}

export const World = createContext<JarWorld | null>(null);

export function useJarWorld(): JarWorld {
  const world = useContext(World);
  if (!world) throw new Error('useJarWorld needs JarWorldProvider');
  return world;
}
