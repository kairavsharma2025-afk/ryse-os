import { Navigate, Route, Routes } from 'react-router-dom'
import { useCharacter } from '@/stores/characterStore'
import { useSync } from '@/sync'
import { Layout } from '@/components/Layout'
import { Onboarding } from '@/pages/Onboarding'
import { SignIn } from '@/pages/SignIn'
import { Home } from '@/pages/Home'
import { Goals } from '@/pages/Goals'
import { GoalDetail } from '@/pages/GoalDetail'
import { Profile } from '@/pages/Profile'
import { Achievements } from '@/pages/Achievements'
import { Loot } from '@/pages/Loot'
import { Skills } from '@/pages/Skills'
import { Settings } from '@/pages/Settings'
import { Schedule } from '@/pages/Schedule'
import { Plan } from '@/pages/Plan'
import { Life } from '@/pages/Life'
import { Reminders } from '@/pages/Reminders'
import { Birthdays } from '@/pages/Birthdays'
import { Privacy } from '@/pages/Privacy'
import { SeasonPage } from '@/pages/SeasonPage'
import { Finite } from '@/pages/modules/Finite'
import { Ritual } from '@/pages/modules/Ritual'
import { OneDegree } from '@/pages/modules/OneDegree'
import { Unsent } from '@/pages/modules/Unsent'
import { Silence } from '@/pages/modules/Silence'
import { Values } from '@/pages/modules/Values'

export default function App() {
  const initialised = useCharacter((s) => s.initialised)
  const signedIn = useSync((s) => s.enabled)

  // No session → /signin gate before anything else.
  if (!signedIn) {
    return (
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/privacy"
          element={
            <div className="min-h-full p-4 md:p-8">
              <Privacy />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/signin" replace />} />
      </Routes>
    )
  }

  if (!initialised) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route
          path="/privacy"
          element={
            <div className="min-h-full p-4 md:p-8">
              <Privacy />
            </div>
          }
        />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route path="/signin" element={<Navigate to="/" replace />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/life" element={<Life />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/achievements" element={<Achievements />} />
        <Route path="/loot" element={<Loot />} />
        <Route path="/skills" element={<Skills />} />
        <Route path="/season" element={<SeasonPage />} />
        <Route path="/birthdays" element={<Birthdays />} />
        <Route path="/finite" element={<Finite />} />
        <Route path="/ritual" element={<Ritual />} />
        <Route path="/onedegree" element={<OneDegree />} />
        <Route path="/unsent" element={<Unsent />} />
        <Route path="/silence" element={<Silence />} />
        <Route path="/values" element={<Values />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
