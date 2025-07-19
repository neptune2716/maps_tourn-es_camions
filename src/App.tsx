import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import HomePage from './components/HomePage.tsx';
import RouteOptimizer from './components/RouteOptimizer.tsx';

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
