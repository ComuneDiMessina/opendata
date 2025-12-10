import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Catalogo from './pages/Catalogo';
import DettaglioDataset from './pages/DettaglioDataset';
import DettaglioRisorsa from './pages/DettaglioRisorsa';
import Enti from './pages/Enti';
import Temi from './pages/Temi';
import Informazioni from './pages/Informazioni';
import Header from './components/Header';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';

export default function Router() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Header />
      <main id="main-content" className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/dataset/:id" element={<DettaglioDataset />} />
          <Route path="/risorsa/:id" element={<DettaglioRisorsa />} />
          <Route path="/enti" element={<Enti />} />
          <Route path="/temi" element={<Temi />} />
          <Route path="/informazioni" element={<Informazioni />} />
        </Routes>
      </main>
      <Footer />
    </BrowserRouter>
  );
}
