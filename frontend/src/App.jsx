import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TrainsPage from './pages/TrainsPage';
import ConfirmationPage from './pages/ConfirmationPage';
import { ToastProvider } from './components/Toast';

function App() {
  return (
    <Router>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/trains" element={<TrainsPage />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
        </Routes>
      </ToastProvider>
    </Router>
  );
}

export default App;
