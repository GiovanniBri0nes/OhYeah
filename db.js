// db.js
const sql = require('mssql');

const config = {
    user: 'sa', // Reemplaza con tu usuario de la base de datos
    password: 'sas', // Reemplaza con tu contraseña de la base de datos
    server: 'LAPTOP-03NQKEKK', // Reemplaza con tu servidor de la base de datos
    database: 'PIA_PROG_WEB',
    options: {
        encrypt: true, // Usar solo si tu servidor de base de datos lo requiere
        enableArithAbort: true,
        trustServerCertificate: true // Agrega esta línea para deshabilitar la verificación del certificado
    }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Conectado a la base de datos SQL');
        return pool;
    })
    .catch(err => console.log('Error al conectar a la base de datos SQL', err));

module.exports = {
    sql, poolPromise
};