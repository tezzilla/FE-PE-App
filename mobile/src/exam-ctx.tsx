import { createContext, use, type PropsWithChildren } from 'react';

import type { ExamId } from '@/lib/api';
import { useStorageState } from '@/lib/storage';

interface ExamChoice {
  exam: ExamId;
  setExam: (e: ExamId) => void;
}

const ExamContext = createContext<ExamChoice | null>(null);

/** The exam the student is studying for, shared by every tab and remembered between launches. */
export function useExam() {
  const v = use(ExamContext);
  if (!v) throw new Error('useExam must be inside <ExamProvider />');
  return v;
}

export function ExamProvider({ children }: PropsWithChildren) {
  const [[, stored], setStored] = useStorageState('civilprep.exam');
  const exam: ExamId = stored === 'pe-civil' ? 'pe-civil' : 'fe-civil';
  return <ExamContext.Provider value={{ exam, setExam: setStored }}>{children}</ExamContext.Provider>;
}
