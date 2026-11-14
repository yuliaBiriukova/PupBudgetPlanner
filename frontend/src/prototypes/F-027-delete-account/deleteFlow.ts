import { createContext, useContext, useState } from 'react';
import { PASSWORD, WORD, type FamilyRole, type Who } from './deleteData';

/** Who is deleting and what happens after; set by the story. */
export interface DeleteSetup {
  who: Who;
  family: FamilyRole;
  /** The account is gone: the story shows the signed-out screen. */
  onDeleted: () => void;
}

export const DeleteContext = createContext<DeleteSetup>({
  who: 'password',
  family: 'none',
  onDeleted: () => undefined,
});

export const useDeleteSetup = () => useContext(DeleteContext);

/** The confirmation's state and its rules: the heir (an owner with others), the password or Google, the word. */
export function useDeleteFlow() {
  const { who, family, onDeleted } = useDeleteSetup();
  const [heir, setHeir] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [google, setGoogle] = useState<'no' | 'leaving' | 'yes'>('no');
  const [word, setWord] = useState('');
  const [errors, setErrors] = useState<{ heir?: string; proof?: string; word?: string }>({});
  const [pending, setPending] = useState(false);

  const reset = () => {
    setHeir(null);
    setPassword('');
    setGoogle('no');
    setWord('');
    setErrors({});
    setPending(false);
  };

  const submit = () => {
    const found: typeof errors = {};
    if (family === 'owner' && !heir) found.heir = 'Pick who looks after the family.';
    if (who === 'password' && !password) found.proof = 'Enter your password.';
    else if (who === 'password' && password !== PASSWORD)
      found.proof = 'That password isn’t right.';
    if (who === 'google' && google !== 'yes') found.proof = 'Confirm with Google first.';
    if (word.trim().toUpperCase() !== WORD) found.word = `Type ${WORD} to confirm.`;
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setPending(true);
    window.setTimeout(onDeleted, 1200);
  };

  return {
    who,
    family,
    heir,
    password,
    google,
    word,
    errors,
    pending,
    reset,
    submit,
    pickHeir: (id: string) => {
      setHeir(id);
      setErrors((e) => ({ ...e, heir: undefined }));
    },
    typePassword: (value: string) => {
      setPassword(value);
      setErrors((e) => ({ ...e, proof: undefined }));
    },
    // The real app goes to Google and comes back to Settings; here it takes a moment and comes back confirmed
    confirmWithGoogle: () => {
      setGoogle('leaving');
      window.setTimeout(() => {
        setGoogle('yes');
        setErrors((e) => ({ ...e, proof: undefined }));
      }, 900);
    },
    typeWord: (value: string) => {
      setWord(value);
      setErrors((e) => ({ ...e, word: undefined }));
    },
  };
}

export type DeleteFlow = ReturnType<typeof useDeleteFlow>;
