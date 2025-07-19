import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import HomePage from './components/HomePage.tsx';
import RouteOptimizer from './components/RouteOptimizer.tsx';
import SetupGuide from './components/SetupGuide.tsx';

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
