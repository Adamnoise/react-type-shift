
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JSXConverterPage from './pages/JSXConverter';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<JSXConverterPage />} />
      </Routes>
    </Router>
  );
}

export default App;
