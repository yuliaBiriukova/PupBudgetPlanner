import { useState } from 'react';
import { CloseJarDialog, JarDialog, JarFormDialog, MoveDialog } from './JarParts';
import type { Jar } from './jarsApi';

/** How long a jar's bar fills after money went in (Jars.module.css). */
const FRESH_MS = 1700;

/**
 * The dialogs a page with jars needs, and what opens them. The ones opened from another (move, edit, close) are mounted
 * as they open, so each comes over the jar's window rather than behind it.
 */
export function useJarDialogs() {
  const [openId, setOpenId] = useState<string>();
  const [moving, setMoving] = useState<{ jar: Jar; kind: 'in' | 'out'; key: number }>();
  // New jar (no jar) or a jar edited from its pencil
  const [form, setForm] = useState<{ jar?: Jar; key: number } | null>(null);
  // Closing a jar asks first, from its window or its edit form
  const [closing, setClosing] = useState<Jar>();
  // The jar whose bar just changed: its one moment of motion
  const [fresh, setFresh] = useState<string>();
  const move = (jar: Jar, kind: 'in' | 'out') => {
    setMoving({ jar, kind, key: Date.now() });
  };

  const dialogs = (
    <>
      <JarDialog
        jarId={openId}
        fresh={fresh}
        onClose={() => {
          setOpenId(undefined);
        }}
        onMove={move}
        onEdit={(jar) => {
          setForm({ jar, key: Date.now() });
        }}
        onCloseJar={setClosing}
      />
      {moving && (
        <MoveDialog
          key={moving.key}
          target={moving}
          onClose={() => {
            setMoving(undefined);
          }}
          onDone={(jarId) => {
            setFresh(jarId);
            window.setTimeout(() => {
              setFresh(undefined);
            }, FRESH_MS);
          }}
        />
      )}
      {form && (
        <JarFormDialog
          key={form.key}
          jar={form.jar}
          onCloseJar={setClosing}
          onClose={() => {
            setForm(null);
          }}
        />
      )}
      {closing && (
        <CloseJarDialog
          key={closing.id}
          jar={closing}
          onClose={() => {
            setClosing(undefined);
          }}
          onClosed={() => {
            setForm(null);
            setOpenId(undefined);
          }}
        />
      )}
    </>
  );
  return {
    dialogs,
    fresh,
    openJar: (jar: Jar) => {
      setOpenId(jar.id);
    },
    moveJar: move,
    addJar: () => {
      setForm({ key: Date.now() });
    },
  };
}
