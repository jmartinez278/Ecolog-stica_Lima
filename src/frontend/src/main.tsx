import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './style.css'

const root = document.getElementById('root')!
const app = <React.StrictMode><App /></React.StrictMode>
// El build entrega el acceso ya visible; React hidrata los mismos controles.
if (root.hasChildNodes()) ReactDOM.hydrateRoot(root, app)
else ReactDOM.createRoot(root).render(app)
