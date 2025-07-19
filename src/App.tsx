import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import RouteOptimizer from './components/RouteOptimizer';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/optimize" element={<RouteOptimizer />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
