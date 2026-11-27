import { useState } from 'react';
import { CloseJarDialog, JarDialog, MoveDialog, NewJarDialog } from './JarParts';
import type { Jar } from './jars';

/** The dialogs one page needs, and what opens them. */
export function useJarDialogs() {
  const [open, setOpen] = useState<Jar>();
  const [moving, setMoving] = useState<{ jar: Jar; kind: 'in' | 'out' }>();
  // New jar (no jar) or a jar edited from its pencil
  const [form, setForm] = useState<{ jar?: Jar; key: number } | null>(null);
  // Closing a jar asks first, from its window or its edit form
  const [closing, setClosing] = useState<Jar>();
  const dialogs = (
    <>
      <JarDialog
        jar={open}
        onClose={() => {
          setOpen(undefined);
        }}
        onMove={(jar, kind) => {
          setMoving({ jar, kind });
        }}
        onEdit={(jar) => {
          setForm({ jar, key: Date.now() });
        }}
        onCloseJar={setClosing}
      />
      <MoveDialog
        target={moving}
        onClose={() => {
          setMoving(undefined);
        }}
      />
      {form && (
        <NewJarDialog
          key={form.key}
          opened
          jar={form.jar}
          onCloseJar={setClosing}
          onClose={() => {
            setForm(null);
          }}
        />
      )}
      <CloseJarDialog
        jar={closing}
        onClose={() => {
          setClosing(undefined);
        }}
        onClosed={() => {
          setForm(null);
          setOpen(undefined);
        }}
      />
    </>
  );
  return {
    dialogs,
    openJar: setOpen,
    moveJar: (jar: Jar, kind: 'in' | 'out') => {
      setMoving({ jar, kind });
    },
    addJar: () => {
      setForm({ key: Date.now() });
    },
  };
}
