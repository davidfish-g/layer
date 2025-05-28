import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from './api/auth/[...nextauth]/route'
import Header from './components/Header'
import PersonaList from './components/PersonaList'
import VideoUpload from './components/VideoUpload'

export default async function HomePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Personas Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Your Personas</h2>
              <p className="text-muted-foreground">
                Create and manage AI personas with custom faces and voices
              </p>
            </div>
            <PersonaList />
          </div>
          
          {/* Video Upload Section */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Transform Video</h2>
              <p className="text-muted-foreground">
                Upload a video to transform with your persona
              </p>
            </div>
            <VideoUpload />
          </div>
        </div>
      </main>
    </div>
  )
} 