import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './components/HomePage';
import RouteOptimizer from './components/RouteOptimizer';
import SetupGuide from './components/SetupGuide';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/optimize" element={<RouteOptimizer />} />
          <Route path="/setup" element={<SetupGuide />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
