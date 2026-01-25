export default function LoginPage() {
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
      <h1 style={{ color: '#bb5026', fontSize: '2.5rem', marginBottom: '1rem' }}>
        Página de Login
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#94a3b8' }}>
        Este es el inicio de tu misión de acceso.
      </p>
      
      {/* Esto es un hueco temporal, luego usaremos la carpeta components */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        border: '2px dashed #334155',
        borderRadius: '8px' 
      }}>
        [ Aquí conectaremos el componente del formulario ]
        <a href="/register" style={{ color: '#4ade80', marginTop: '20px' }}>¿No tienes cuenta? Regístrate aquí</a>
      </div>
    </main>
  );
}