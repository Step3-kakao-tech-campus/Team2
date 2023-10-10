import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/Login';
import Layout from './common/templates/Layout';
import LandingPage from './pages/Landing';
import AccountPage from './pages/Account';
import Canvas from './pages/Canvas';
import AlbumCreationPage from './pages/AlbumCreate/AlbumCreate';
import AlbumGroupPage from './pages/AlbumGroup';
import ScannerPage from './pages/QrScan';

const Router = () => (
    <BrowserRouter>
        <Routes>
            <Route element={<Layout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="account" element={<AccountPage />} />
                <Route path="albumcreate" element={<AlbumCreationPage/>}/>
                <Route path="album" element={<AlbumGroupPage />} />
            </Route>
            <Route path="login" element={<LoginPage />} />
            <Route path="canvas" element={<Canvas />} />
            <Route path="scanner" element={<ScannerPage />} />
        </Routes>
    </BrowserRouter>
);

export default Router;
