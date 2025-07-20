import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout.tsx';
import HomePage from './components/HomePage.tsx';
import RouteOptimizer from './components/RouteOptimizer.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/optimize" element={<RouteOptimizer />} />
          </Routes>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
