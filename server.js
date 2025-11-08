const express = require('express');
const cors = require('cors');
const sql = require('mssql/msnodesqlv8');

const app = express();


app.use(cors({ origin: ['http://127.0.0.1:5500', 'http://localhost:5500'] }));         
app.use(express.json()); 

const connectionString =
  'Driver={ODBC Driver 17 for SQL Server};' +
  'Server=DESKTOP-7J48I3F;' +
  'Database=INTAConectaDB;' +
  'Trusted_Connection=Yes;';

async function testConnection() {
  try {
    const pool = await sql.connect({ connectionString });
    const r = await pool.request().query('SELECT GETDATE() AS ahora');
    console.log('✅ Conexión OK. Fecha SQL:', r.recordset[0].ahora);
  } catch (err) {
    console.dir(err, { depth: null });
  }
}

app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, correo, departamento } = req.body;

    // Validaciones
    if (!nombre || !correo || !departamento) {
      return res.status(400).json({ ok:false, msg:'Completa nombre, correo y departamento.' });
    }
    if (!/\S+@\S+\.\S+/.test(correo)) {
      return res.status(400).json({ ok:false, msg:'Correo inválido.' });
    }

    const pool = await sql.connect({ connectionString });

    // 1) Buscar IdDepartamento por nombre
    let result = await pool.request()
      .input('Nombre', sql.NVarChar(100), departamento.trim())
      .query('SELECT IdDepartamento FROM dbo.Departamento WHERE Nombre=@Nombre');

    let idDepto = result.recordset[0]?.IdDepartamento;

    // 2) Si no existe, crearlo y recuperar el Id
    if (!idDepto) {
      result = await pool.request()
        .input('Nombre', sql.NVarChar(100), departamento.trim())
        .query(`
          INSERT INTO dbo.Departamento (Nombre)
          OUTPUT INSERTED.IdDepartamento
          VALUES (@Nombre)
        `);
      idDepto = result.recordset[0].IdDepartamento;
    }

    // 3) Insertar el usuario (sin DepartamentoTexto)
    await pool.request()
      .input('NombreCompleto', sql.NVarChar(150), nombre.trim())
      .input('Email',          sql.NVarChar(150), correo.trim())
      .input('IdDepartamento', sql.Int,            idDepto)
      .query(`
        INSERT INTO dbo.Usuario (NombreCompleto, Email, IdDepartamento)
        VALUES (@NombreCompleto, @Email, @IdDepartamento)
      `);

    res.json({ ok:true, msg:'Registro exitoso. ¡Gracias por participar!' });
  } catch (err) {
    console.error('ERROR /api/registro =>', err);
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('2627') || msg.includes('2601')) {
      return res.status(409).json({ ok:false, msg:'El correo ya está registrado.' });
    }
    res.status(500).json({ ok:false, msg:'Error del servidor.' });
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`HTTP en http://localhost:${PORT}`));
testConnection();
