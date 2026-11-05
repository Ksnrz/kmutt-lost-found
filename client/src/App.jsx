import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Map from './pages/Map.jsx'

function App() {
  const path = window.location.pathname

  if (path === '/register') return <Register />
  if (path === '/map') return <Map />

  return <Login />
}

export default App
