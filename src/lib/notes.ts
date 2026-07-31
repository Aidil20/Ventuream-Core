// Helper utilities for persisting and searching asset investment rationale notes
export const getHoldingNote = (ticker: string): string => {
  if (!ticker) return '';
  try {
    const clean = ticker.replace(/\.JK$/i, '').toUpperCase();
    return localStorage.getItem(`vam_holding_note_${clean}`) || '';
  } catch {
    return '';
  }
};

export const saveHoldingNote = (ticker: string, note: string): void => {
  if (!ticker) return;
  try {
    const clean = ticker.replace(/\.JK$/i, '').toUpperCase();
    if (!note.trim()) {
      localStorage.removeItem(`vam_holding_note_${clean}`);
    } else {
      localStorage.setItem(`vam_holding_note_${clean}`, note.trim());
    }
    window.dispatchEvent(new CustomEvent('vam_notes_updated', { detail: { ticker: clean } }));
  } catch (e) {
    console.warn('Failed to save holding note to localStorage:', e);
  }
};

export const getAllHoldingNotes = (): Record<string, string> => {
  const notes: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vam_holding_note_')) {
        const ticker = key.replace('vam_holding_note_', '');
        notes[ticker] = localStorage.getItem(key) || '';
      }
    }
  } catch (e) {
    console.warn('Failed to read notes from localStorage:', e);
  }
  return notes;
};
