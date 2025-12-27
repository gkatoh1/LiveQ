import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Import your pages
import LandingPage from './LandingPage' // Your new Marketing Page
import UserView from './UserView'       // Your Audience App (Formerly App.jsx)
import Admin from './Admin'             // Your Master Admin (from your old main.jsx)
import EventAdmin from './EventAdmin'   // Your Event Dashboard
import Projector from './Projector'     // Your Projector View
import DemoPage from './DemoPage'       // <--- The new Demo Page

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Marketing Page (Root URL) */}
        <Route path="/" element={<LandingPage />} />

        {/* 2. The New Demo Page for Screen Recording */}
        <Route path="/demopage" element={<DemoPage />} />

        {/* 3. Master Admin (e.g., to create events) */}
        <Route path="/admin" element={<Admin />} />

        {/* 4. Event Admin (e.g., /admin/demo) */}
        <Route path="/admin/:slug" element={<EventAdmin />} />

        {/* 5. Projector View (e.g., /projector/demo) */}
        <Route path="/projector/:slug" element={<Projector />} />

        {/* 6. Audience View (e.g., /demo) 
            This must be LAST because ":slug" catches everything else.
        */}
        <Route path="/:slug" element={<UserView />} />
      </Routes>
    </BrowserRouter>
  )
}