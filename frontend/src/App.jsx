import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Status from './pages/Status';
import Settings from './pages/Settings';

export default function App() {
  return (
    <div className="p-4">
      <nav className="flex gap-4 mb-4">
        <Link to="/">Home</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/status">Status</Link>
        <Link to="/settings">Settings</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/status" element={<Status />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  );
}
