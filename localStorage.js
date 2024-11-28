document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const nombres = document.getElementById('nombres').value;
    const apellidos = document.getElementById('apellidos').value;
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const correo = document.getElementById('correo').value;
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const fechaCreacion = document.getElementById('fechaCreacion').value;

    // Guardar los datos del usuario en localStorage
    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    usuarios.push({ username, password });
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    console.log('Usuario registrado:', {
        nombres,
        apellidos,
        fechaNacimiento,
        correo,
        username,
        password,
        fechaCreacion
    });

    window.location.href = `pagina_destino.html?username=${username}`;
});

document.getElementById("loginForm").addEventListener("submit", function (event) {
    event.preventDefault();

    const usernameInput = document.querySelector(".username input[type='text']").value;
    const passwordInput = document.querySelector(".username input[type='password']").value;

    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];
    const usuarioValido = usuarios.find(user => user.username === usernameInput && user.password === passwordInput);

    if (usuarioValido) {
        // Redirigir a otra página si el inicio de sesión es exitoso
        window.location.href = "pagina_destino.html";
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
});
