import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center">
      <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl">
        <h1 className="text-6xl font-bold text-white mb-4">
          🚀 VibeCodeStack
        </h1>
        <p className="text-xl text-white/90 mb-8">
          Ready to build something amazing?
        </p>
        
        <div className="space-y-4">
          <button
            className="bg-white/20 hover:bg-white/30 text-white px-8 py-3 rounded-full font-semibold transition-all duration-200 hover:scale-105"
            onClick={() => setCount((count) => count + 1)}
          >
            Count is {count}
          </button>
          
          <div className="text-white/80 text-sm">
            <p>Edit <code className="bg-black/20 px-2 py-1 rounded">src/App.tsx</code> and save to test HMR</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App