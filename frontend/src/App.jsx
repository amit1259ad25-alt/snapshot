import React from 'react'
import {BrowserRouter as Router, Routes , Route, Navigate} from "react-router-dom"
import CreatePost from "./pages/createPost.jsx";
import Feed from "./pages/feed.jsx"

const App = () => {
  return (
    <Router>
        <Routes>
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path='/create' element={<CreatePost/>} />
            <Route path='/feed' element={<Feed/>} />
        </Routes>
    </Router>
  )
}

export default App