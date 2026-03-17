import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import CustomerDashboard from './CustomerDashboard';
import ProviderDashboard from './ProviderDashboard';

// Placeholders for components you will create from your HTML files
const Register = () => <h2>Register Page (Migrate register.html here)</h2>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customer" element={<CustomerDashboard />} />
        <Route path="/provider" element={<ProviderDashboard />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;