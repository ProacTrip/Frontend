export default function RegisterPage() {
  return (
    <main style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      backgroundColor: '#0f172a', 
      color: 'white',
      fontFamily: 'sans-serif' 
    }}>
      <h1 style={{ color: '#4ade80', fontSize: '2.5rem', marginBottom: '1rem' }}>
        Página de Registro
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
        Crea tu cuenta para empezar el proyecto.
      </p>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        border: '2px dashed #4ade80',
        borderRadius: '8px' 
      }}>
        [ Aquí irá el componente de Registro ]
        <a href="/login" style={{ color: '#38bdf8', marginTop: '20px' }}>¿Ya tienes cuenta? Entra aquí</a>
      </div>
    </main>
  );
}