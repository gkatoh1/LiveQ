import { Routes, Route } from 'react-router-dom'
import LandingPage from './LandingPage'
import DemoPage from './DemoPage'
import UserView from './UserView'
import EventAdmin from './EventAdmin'
import Projector from './Projector' // Imported here
import OrganizerDashboard from './OrganizerDashboard'
import Admin from './Admin' 

function App() {
  return (
    <Routes>
      {/* 1. Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/demopage" element={<DemoPage />} />

      {/* 2. GOD MODE (You) */}
      <Route path="/master" element={<Admin />} />

      {/* 3. USER DASHBOARD (Sign up / Create Event) */}
      <Route path="/admin" element={<OrganizerDashboard />} />

      {/* 4. SPECIFIC EVENT ADMIN */}
      <Route path="/admin/:slug" element={<EventAdmin />} />

      {/* 5. PROJECTOR VIEW (Added this) */}
      <Route path="/projector/:slug" element={<Projector />} />

      {/* 6. CATCH-ALL (Audience View) - MUST BE LAST */}
      <Route path="/:slug" element={<UserView />} />
    </Routes>
  )
}

export default App