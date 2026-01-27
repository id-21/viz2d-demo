import { Routes, Route } from 'react-router-dom'
import VisualizerDemo from "./visualizer-demo"
import { ApiTestPage } from "./pages/ApiTestPage"
import GalleryPage from "./pages/GalleryPage"
import ComparePage from "./pages/ComparePage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<VisualizerDemo />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/api-test" element={<ApiTestPage />} />
      <Route path="/compare" element={<ComparePage />} />
    </Routes>
  )
}

export default App
