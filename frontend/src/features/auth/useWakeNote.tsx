import { useServerWake } from '../../app/shell/useServerWake';
import { WakeNote } from './AuthFormParts';

/** The waking-up note for a form, while the server takes long to answer at night. */
export function useWakeNote() {
  const wake = useServerWake();
  return wake.waking ? <WakeNote seconds={wake.seconds} /> : null;
}
