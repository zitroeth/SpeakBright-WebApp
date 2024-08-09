// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
import './App.css'
import NavBar from './components/NavBar'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from './hooks/useAuth';
import LinearProgress from '@mui/material/LinearProgress';
import { ThemeProvider } from '@emotion/react';
import mainTheme from './themes/Theme';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { default as Home } from './pages/Home';
import { default as Login } from './pages/Login';
import { default as Register } from './pages/Register';
import { default as Student } from './pages/Student';


function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <>
        <NavBar />
        <ThemeProvider theme={mainTheme}>
          <LinearProgress color="secondary" />
        </ThemeProvider>
      </>); // Or any loading spinner component
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={currentUser ? <Home /> : <Navigate to="/Login" replace />} />
          <Route path="/Home" element={currentUser ? <Home /> : <Navigate to="/Login" replace />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/Home/:id" element={<Student />} />
        </Routes>
      </BrowserRouter>
    </LocalizationProvider>
  )
}

export default App
