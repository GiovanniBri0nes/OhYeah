// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sql, poolPromise } = require('./db');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'Public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'Public', 'InicioSesion.html'));
  });
app.use(bodyParser.json({ limit: '50mb' })); // Aumentar el límite de tamaño de la solicitud si es necesario
app.use(cors());

// Ruta para manejar el inicio de sesión
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Username', sql.NVarChar, username)
            .input('Contraseña', sql.NVarChar, password)
            .query('SELECT * FROM Usuario WHERE Username = @Username AND Contraseña = @Contraseña');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: 'Nombre de usuario o contraseña incorrectos' });
        }
    } catch (err) {p
        res.status(500).json({ success: false, message: err.message });
    }
});

// Ruta para manejar el registro de usuarios
app.post('/api/register', async (req, res) => {
    try {
        const { nombres, apellidos, fechaNacimiento, correo, username, password, image } = req.body;

        // Convertir la imagen base64 a un buffer
        const imageBuffer = Buffer.from(image.split(',')[1], 'base64');

        const pool = await poolPromise;
        const result = await pool.request()
            .input('Nombres', sql.NVarChar, nombres)
            .input('Apellidos', sql.NVarChar, apellidos)
            .input('Nacimiento', sql.Date, fechaNacimiento)
            .input('Correo', sql.NVarChar, correo)
            .input('Foto', sql.VarBinary, imageBuffer)
            .input('Username', sql.NVarChar, username)
            .input('Contraseña', sql.NVarChar, password)
            .query('INSERT INTO Usuario (Nombres, Apellidos, Nacimiento, Correo, Foto, Username, Contraseña, Fecha_Creacion) VALUES (@Nombres, @Apellidos, @Nacimiento, @Correo, @Foto, @Username, @Contraseña, GETDATE()); SELECT SCOPE_IDENTITY() AS Id_Usuario');

        const Id_Usuario = result.recordset[0].Id_Usuario;
        res.status(201).json({ success: true, Id_Usuario });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// Ruta para obtener todas las publicaciones
app.get('/api/publicaciones', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query(`
            SELECT p.*, c.NombreCategoria 
            FROM Publicacion p
            JOIN Publicacion_Categoria pc ON p.Id_Publicacion = pc.Id_Publicacion
            JOIN Categoria c ON pc.Id_Categoria = c.Id_Categoria
        `);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Ruta para crear una nueva publicación
app.post('/api/publicaciones', async (req, res) => {
    try {
        const { Id_Usuario, Titulo, Contenido, Id_Categoria } = req.body;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Id_Usuario', sql.Int, Id_Usuario)
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Contenido', sql.Text, Contenido)
            .input('Id_Categoria', sql.Int, Id_Categoria)
            .query('INSERT INTO Publicacion (Id_Usuario, Titulo, Contenido, FechaPublicacion, UltimaEdicion) VALUES (@Id_Usuario, @Titulo, @Contenido, GETDATE(), GETDATE()); SELECT SCOPE_IDENTITY() AS Id_Publicacion');

        const Id_Publicacion = result.recordset[0].Id_Publicacion;

        await pool.request()
            .input('Id_Publicacion', sql.Int, Id_Publicacion)
            .input('Id_Categoria', sql.Int, Id_Categoria)
            .query('INSERT INTO Publicacion_Categoria (Id_Publicacion, Id_Categoria) VALUES (@Id_Publicacion, @Id_Categoria)');

        res.status(201).json({ success: true, Id_Publicacion });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Ruta para actualizar una publicación
app.put('/api/publicaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { Titulo, Contenido, Id_Categoria } = req.body;
        const pool = await poolPromise;
        await pool.request()
            .input('Id_Publicacion', sql.Int, id)
            .input('Titulo', sql.NVarChar, Titulo)
            .input('Contenido', sql.Text, Contenido)
            .input('Id_Categoria', sql.Int, Id_Categoria)
            .query('UPDATE Publicacion SET Titulo = @Titulo, Contenido = @Contenido, UltimaEdicion = GETDATE() WHERE Id_Publicacion = @Id_Publicacion');

        await pool.request()
            .input('Id_Publicacion', sql.Int, id)
            .input('Id_Categoria', sql.Int, Id_Categoria)
            .query('UPDATE Publicacion_Categoria SET Id_Categoria = @Id_Categoria WHERE Id_Publicacion = @Id_Publicacion');

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Ruta para eliminar una publicación
app.delete('/api/publicaciones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        await pool.request()
            .input('Id_Publicacion', sql.Int, id)
            .query('DELETE FROM Publicacion_Categoria WHERE Id_Publicacion = @Id_Publicacion');

        await pool.request()
            .input('Id_Publicacion', sql.Int, id)
            .query('DELETE FROM Publicacion WHERE Id_Publicacion = @Id_Publicacion');

        res.status(200).json({ success: true });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Ruta para actualizar el perfil del usuario
app.put('/api/usuarios/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombres, Apellidos, Nacimiento, Correo } = req.body;

        console.log('Datos recibidos del cliente:', req.body);
        console.log('ID del usuario recibido:', id);

        const pool = await poolPromise;
        await pool.request()
            .input('Id_Usuario', sql.Int, id)
            .input('Nombres', sql.VarChar, Nombres)
            .input('Apellidos', sql.VarChar, Apellidos)
            .input('Nacimiento', sql.Date, Nacimiento)
            .input('Correo', sql.VarChar, Correo)
            .query('UPDATE Usuario SET Nombres = @Nombres, Apellidos = @Apellidos, Nacimiento = @Nacimiento, Correo = @Correo WHERE Id_Usuario = @Id_Usuario');

        res.status(200).json({ success: true });
    } catch (err) {
        console.error('Error en la actualización:', err.message);
        res.status(500).send(err.message);
    }
});


// Ruta para obtener las publicaciones del usuario
app.get('/api/publicaciones/usuario/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await poolPromise;
        const result = await pool.request()
            .input('Id_Usuario', sql.Int, id)
            .query('SELECT * FROM Publicacion WHERE Id_Usuario = @Id_Usuario ORDER BY FechaPublicacion DESC');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Ruta para buscar publicaciones con filtros
app.get('/api/publicaciones/buscar', async (req, res) => {
    try {
        const { termino, fechaInicio, fechaFin, categoria } = req.query;
        const pool = await poolPromise;
        let query = `
            SELECT p.*, c.NombreCategoria 
            FROM Publicacion p
            JOIN Publicacion_Categoria pc ON p.Id_Publicacion = pc.Id_Publicacion
            JOIN Categoria c ON pc.Id_Categoria = c.Id_Categoria
            WHERE p.Contenido LIKE '%' + @termino + '%'
        `;
        if (fechaInicio) {
            query += ' AND p.FechaPublicacion >= @fechaInicio';
        }
        if (fechaFin) {
            query += ' AND p.FechaPublicacion <= @fechaFin';
        }
        if (categoria) {
            query += ' AND c.NombreCategoria = @categoria';
        }
        const result = await pool.request()
            .input('termino', sql.NVarChar, termino || '')
            .input('fechaInicio', sql.Date, fechaInicio || null)
            .input('fechaFin', sql.Date, fechaFin || null)
            .input('categoria', sql.NVarChar, categoria || '')
            .query(query);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).send(err.message);
    }
});



app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});


