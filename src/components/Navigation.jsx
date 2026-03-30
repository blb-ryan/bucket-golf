import { useNavigate, useLocation } from 'react-router-dom'
import './Navigation.css'

export default function Navigation({ title, showBack = false, rightAction }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/' || location.pathname === '/bucket-golf/'

  function handleBack() {
    navigate('/')
  }

  return (
    <header className="nav-header">
      <div className="nav-inner">
        {showBack && !isHome ? (
          <button className="nav-back" onClick={handleBack} aria-label="Go back">
            <span>&#8592;</span>
          </button>
        ) : (
          <div className="nav-spacer" />
        )}
        <h1 className="nav-title">{title || 'Bucket Golf'}</h1>
        {rightAction || <div className="nav-spacer" />}
      </div>
    </header>
  )
}
