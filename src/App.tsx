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
import AdminHome from './pages/AdminHome';
import AdminViewGuardians from './pages/AdminViewGuardians';
import AdminViewGuardianStudents from './pages/AdminViewGuardianStudents';

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

            <Route path="/Home/Admin/" element={
              <PrivateRoute> {/* Redirects to login if not logged in */}
                <AdminHome />
                <AdminViewGuardians />
              </PrivateRoute>
            } />

            <Route path="/Home/Admin/:guardianId" element={
              <PrivateRoute> {/* Redirects to login if not logged in */}
                <AdminHome />
                <AdminViewGuardianStudents />
              </PrivateRoute>
            } />


          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </LocalizationProvider>
  )
}

export default App
