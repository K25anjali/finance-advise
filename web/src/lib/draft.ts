/**
 * Carries a message typed on the landing page through sign-up into the app's composer.
 * sessionStorage: survives the redirect and the OAuth round-trip, but not a closed tab.
 */
const KEY = 'll_draft'

export function saveDraft(text: string) {
  try {
    sessionStorage.setItem(KEY, text)
  } catch {
    // storage blocked (private mode) — the visitor just retypes it
  }
}

export function peekDraft(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearDraft() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}
