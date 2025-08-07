
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'


// Set the document title
document.title = "ilara";

createRoot(document.getElementById("root")!).render(<App />);
