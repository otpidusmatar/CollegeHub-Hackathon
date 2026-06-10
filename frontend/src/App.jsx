import React from 'react';
import { useLocation, HashRouter as Router, Route, Routes, } from "react-router-dom";
import Home from './pages/Home'

function RouteContainer() {
  const location = useLocation()

  return (
    <Routes location={location} key={location.key}>
      <Route exact path="/" element={<Home />} />
    </Routes>
  )

}

function App() {
  return (
    <>
      <Router>
        <RouteContainer />
      </Router>
    </>
  );
}

export default App;