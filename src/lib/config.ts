// ============================================================
// APP CONFIG
// ============================================================

export const config = {
  app: {
    name: 'MortgageAI',
    description: 'AI-powered mortgage processing assistant',
    url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  },
  ai: {
    model: 'claude-sonnet-4-6',
    confidenceThreshold: 0.75,
    maxTokens: 2048,
  },
  documents: {
    maxFileSizeMB: 25,
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/heic',
      'image/heif',
    ],
    storageBucket: 'documents',
  },
  reminders: {
    maxBeforeUnresponsive: 3,
    intervalDays: 3,
  },
  email: {
    from: process.env.EMAIL_FROM ?? 'noreply@mortgage-ai.com',
    fromName: 'MortgageAI',
  },
}
