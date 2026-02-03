import { Routes, Route } from 'react-router-dom';
import Layout from '@/components/ui/Layout';
import Home from '@/pages/Home/Home';
import Create from '@/pages/Create/Create';
import Chat from '@/pages/Chat/Chat';
import Profile from '@/pages/Profile/Profile';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="create" element={<Create />} />
        <Route path="chat/:id" element={<Chat />} />
        <Route path="profile/:id" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
