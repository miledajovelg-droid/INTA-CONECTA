document.getElementById('registroForm').addEventListener('submit', async (e) => {
  e.preventDefault(); // evita que se recargue la página

  const nombre = document.getElementById('nombre').value.trim();
  const departamento = document.getElementById('departamento').value.trim();
  const correo = document.getElementById('email').value.trim();

  try {
    const r = await fetch('http://127.0.0.1:3000/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre, correo, departamento })
    });
    const data = await r.json();
    alert(data.msg || (r.ok ? 'Registro enviado correctamente' : 'Error al registrar'));
    if (r.ok) e.target.reset();
  } catch (error) {
    alert('No se pudo enviar. Verifica que el servidor Node esté corriendo en el puerto 3000.');
  }
});
