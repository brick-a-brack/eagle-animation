import { Routes, Route, MemoryRouter as Router } from 'react-router-dom';
import Container from './components/Container';

import HomeView from './views/Home';
import AnimatorView from './views/Animator';
import SettingsView from './views/Settings';
import ShortcutsView from './views/Shortcuts';
import ExportView from './views/Export';

const App = () => (
  <Container>
    <Router>
      <Routes>
        <Route exact path="/" element={<HomeView />} />
        <Route exact path="/settings" element={<SettingsView />} />
        <Route exact path="/shortcuts" element={<ShortcutsView />} />
        <Route exact path="/animator/:id/:track" element={<AnimatorView />} />
        <Route exact path="/export/:id/:track" element={<ExportView />} />
        <Route path="*" element={<>404</>} />
      </Routes>
    </Router>
  </Container>
);

export default App;
