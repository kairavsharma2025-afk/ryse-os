import type { OneDegreeQuestion } from '@/types'

// Curated, slow questions. Designed to widen the inner world by one degree per day.
export const ONE_DEGREE_QUESTIONS: OneDegreeQuestion[] = [
  // self
  { id: 'q1', text: 'What did you defend today that doesn\'t deserve defending?', category: 'self' },
  { id: 'q2', text: 'Where in your life are you waiting for permission you\'ll never get?', category: 'self' },
  { id: 'q3', text: 'What\'s a story you tell about yourself that is no longer true?', category: 'self' },
  { id: 'q4', text: 'What did your body say today that you ignored?', category: 'self' },
  { id: 'q5', text: 'What energy did you bring into the room when no one was looking?', category: 'self' },
  // world
  { id: 'q6', text: 'What\'s something everyone agrees on that might be wrong?', category: 'world' },
  { id: 'q7', text: 'If your industry vanished tomorrow, what would you actually miss?', category: 'world' },
  { id: 'q8', text: 'What problem are you ignoring because solving it is unsexy?', category: 'world' },
  { id: 'q9', text: 'What\'s currently bottlenecking the world that no one\'s talking about?', category: 'world' },
  { id: 'q10', text: 'Where is the world clearly heading that most people haven\'t noticed?', category: 'world' },
  // people
  { id: 'q11', text: 'Who in your life have you been mishearing?', category: 'people' },
  { id: 'q12', text: 'Who do you owe a thank-you that you keep delaying?', category: 'people' },
  { id: 'q13', text: 'What would your partner say is the single thing they wish you understood?', category: 'people' },
  { id: 'q14', text: 'Who has been quietly carrying you?', category: 'people' },
  { id: 'q15', text: 'Whose company makes you smaller? Whose makes you larger?', category: 'people' },
  // future
  { id: 'q16', text: 'What does year-from-now-you want you to start today?', category: 'future' },
  { id: 'q17', text: 'What does decade-from-now-you want you to stop today?', category: 'future' },
  { id: 'q18', text: 'What is the most expensive non-action of your life right now?', category: 'future' },
  { id: 'q19', text: 'In 5 years, what will you wish you\'d been brave enough to do this year?', category: 'future' },
  { id: 'q20', text: 'What\'s a 10-year bet you could place today for cheap?', category: 'future' },
  // past
  { id: 'q21', text: 'What\'s a moment you\'re still rehearsing in your head, years later?', category: 'past' },
  { id: 'q22', text: 'When were you last astonished?', category: 'past' },
  { id: 'q23', text: 'What did your 20-year-old self get right that you\'ve since forgotten?', category: 'past' },
  { id: 'q24', text: 'What did you walk away from that you should have walked toward?', category: 'past' },
  { id: 'q25', text: 'Who taught you something quietly that you never thanked them for?', category: 'past' },
  // craft
  { id: 'q26', text: 'What\'s the next 1% improvement nobody else will notice?', category: 'craft' },
  { id: 'q27', text: 'In your work, what are you optimising for that you shouldn\'t be?', category: 'craft' },
  { id: 'q28', text: 'What feedback have you been refusing to integrate?', category: 'craft' },
  { id: 'q29', text: 'What\'s the smallest version of your dream that you could ship this month?', category: 'craft' },
  { id: 'q30', text: 'What discipline could you adopt that would compound for 10 years?', category: 'craft' },
  // self again
  { id: 'q31', text: 'What\'s the lie you tell yourself most often about why you didn\'t do the thing?', category: 'self' },
  { id: 'q32', text: 'When did you last feel awake? What conditions caused it?', category: 'self' },
  { id: 'q33', text: 'What would you do today if no one ever found out?', category: 'self' },
  { id: 'q34', text: 'What would you do today if everyone found out?', category: 'self' },
  { id: 'q35', text: 'What is the version of you that scares you?', category: 'self' },
  // people again
  { id: 'q36', text: 'Who in your circle is coasting? Who is climbing?', category: 'people' },
  { id: 'q37', text: 'What hard conversation are you avoiding by pretending it\'s not yours to start?', category: 'people' },
  { id: 'q38', text: 'When was the last time you said no and meant it?', category: 'people' },
  // future again
  { id: 'q39', text: 'What would change today if you took your obituary seriously?', category: 'future' },
  { id: 'q40', text: 'What\'s the smallest possible move that would put you on a different timeline?', category: 'future' },
]

export function getOneDegreeQuestionForDate(dateISO: string): OneDegreeQuestion {
  // deterministic mapping by date so same day = same question
  const t = new Date(dateISO).getTime()
  const idx = Math.abs(Math.floor(t / 86400000)) % ONE_DEGREE_QUESTIONS.length
  return ONE_DEGREE_QUESTIONS[idx]
}
