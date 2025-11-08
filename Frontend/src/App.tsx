import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { WebSocketProvider } from '@/contexts/WebSocketContext';
import { Toaster } from 'sonner';
import { AppRoutes } from '@/AppRoutes';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;