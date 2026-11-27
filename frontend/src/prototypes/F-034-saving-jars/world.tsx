import { useState, type ReactNode } from 'react';
import { JARS, MOVES, PLAN, TODAY } from './jars';
import { World, type JarWorld } from './worldContext';

/** The prototype's jars and moves, kept while the story is open: putting in and taking out work. */
export function JarWorldProvider({ children }: { children: ReactNode }) {
  const [jars, setJars] = useState(JARS);
  const [moves, setMoves] = useState(MOVES);
  const [fresh, setFresh] = useState<string>();
  const [plan, setPlanState] = useState(PLAN);
  const value: JarWorld = {
    jars,
    moves,
    fresh,
    plan,
    setPlan: (jarId, amount) => {
      setPlanState((now) =>
        amount === null
          ? Object.fromEntries(Object.entries(now).filter(([id]) => id !== jarId))
          : { ...now, [jarId]: amount },
      );
    },
    move: (jarId, accountId, amount, note, accountAmount) => {
      setMoves((list) => [
        ...list,
        {
          id: `m${String(list.length + 1)}`,
          jarId,
          accountId,
          amount,
          date: TODAY,
          note,
          accountAmount,
        },
      ]);
      setFresh(jarId);
      window.setTimeout(() => {
        setFresh(undefined);
      }, 1700);
    },
    addJar: (jar) => {
      setJars((list) => [...list, jar]);
    },
    updateJar: (jar) => {
      setJars((list) => list.map((item) => (item.id === jar.id ? jar : item)));
    },
    closeJar: (jarId) => {
      setJars((list) => list.map((jar) => (jar.id === jarId ? { ...jar, closed: true } : jar)));
    },
  };
  return <World.Provider value={value}>{children}</World.Provider>;
}
