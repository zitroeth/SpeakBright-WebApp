import './App.css'
import NavBar from './components/NavBar'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { default as Home } from './pages/Home';
import { default as Login } from './pages/Login';
import { default as Register } from './pages/Register';
import { default as Student } from './pages/Student';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <AuthProvider>
          <NavBar />
          <Routes>
            <Route path="/Login" element={<Login />} />

            <Route path="/Register" element={<Register />} />

            <Route path="/" element={
              <PrivateRoute> {/* Redirects to login if not logged in */}
                <Home />
              </PrivateRoute>
            } />

            <Route path="/Home" element={
              <PrivateRoute> {/* Redirects to login if not logged in */}
                <Home />
              </PrivateRoute>
            } />

            <Route path="/Home/:id" element={
              <PrivateRoute> {/* Redirects to login if not logged in */}
                <Student />
              </PrivateRoute>
            } />

          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </LocalizationProvider>
  )
}

export default App
