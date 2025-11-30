import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar from './components/Navbar';
import VerifyModal from './components/VerifyModal';

import Home from './pages/Home';
import CreateEvent from './pages/CreateEvent';
import MyTickets from './pages/MyTickets';
import MyEvents from './pages/MyEvents';

const App: React.FC = () => {
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);

  return (
    <Router>
      <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', fontFamily: '"Inter", sans-serif' }}>
        
        <Navbar onVerifyClick={() => setIsVerifyOpen(true)} />
        
        <VerifyModal isOpen={isVerifyOpen} onClose={() => setIsVerifyOpen(false)} />

        <ToastContainer position="bottom-right" autoClose={4000} theme="dark" />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<div className="page-container"><CreateEvent /></div>} />
          <Route path="/my-tickets" element={<div className="page-container"><MyTickets /></div>} />
          <Route path="/dashboard" element={<div className="page-container"><MyEvents /></div>} />
        </Routes>

        <style>{`
          body { margin: 0; padding: 0; }
          .page-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
          * { box-sizing: border-box; }
        `}</style>
      </div>
    </Router>
  );
};

export default App;