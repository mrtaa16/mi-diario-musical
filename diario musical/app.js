const artistaInput = document.getElementById("artista");
const albumInput = document.getElementById("album");
const portadaInput = document.getElementById("portada");
const cancionesInput = document.getElementById("canciones");
const botonAnadir = document.getElementById("anadir");
const buscador = document.getElementById("buscador");
const biblioteca = document.getElementById("biblioteca");
const estadisticas = document.getElementById("estadisticas");

const botonExportar = document.getElementById("exportar");
const botonImportar = document.getElementById("importar");
const archivoInput = document.getElementById("archivo");

let albums = JSON.parse(localStorage.getItem("misAlbums")) || [];
let albumAbierto = null;

function guardar() {
    localStorage.setItem("misAlbums", JSON.stringify(albums));
}

botonAnadir.addEventListener("click", function () {
    const artista = artistaInput.value.trim();
    const album = albumInput.value.trim();
    const portada = portadaInput.value.trim();

    const canciones = cancionesInput.value
        .split("\n")
        .map(c => c.trim())
        .filter(c => c !== "");

    if (!artista || !album || canciones.length === 0) {
        alert("Rellena el artista, el álbum y al menos una canción.");
        return;
    }

    albums.push({
        artista,
        nombre: album,
        portada,
        canciones: canciones.map(nombre => ({
            nombre,
            nota: null
        }))
    });

    guardar();

    artistaInput.value = "";
    albumInput.value = "";
    portadaInput.value = "";
    cancionesInput.value = "";

    mostrarAlbums();
});

buscador.addEventListener("input", mostrarAlbums);

function calcularMedia(album) {
    const valoradas = album.canciones.filter(c => c.nota !== null);

    if (valoradas.length === 0) return "—";

    const suma = valoradas.reduce((total, c) => total + c.nota, 0);
    return (suma / valoradas.length).toFixed(1);
}

function mostrarEstadisticas() {
    const canciones = albums.flatMap(a => a.canciones);
    const valoradas = canciones.filter(c => c.nota !== null);

    const media = valoradas.length
        ? (
            valoradas.reduce((total, c) => total + c.nota, 0) /
            valoradas.length
        ).toFixed(1)
        : "—";

    estadisticas.innerHTML = `
        <p>💿 Álbumes: <strong>${albums.length}</strong></p>
        <p>🎵 Canciones valoradas: <strong>${valoradas.length}</strong></p>
        <p>⭐ Nota media: <strong>${media}/10</strong></p>
    `;
}

function mostrarAlbums() {
    albumAbierto = null;
    biblioteca.innerHTML = "";
    mostrarEstadisticas();

    const busqueda = buscador.value.toLowerCase().trim();

    const filtrados = albums
        .map((album, indice) => ({ album, indice }))
        .filter(({ album }) =>
            album.nombre.toLowerCase().includes(busqueda) ||
            album.artista.toLowerCase().includes(busqueda)
        );

    if (filtrados.length === 0) {
        biblioteca.textContent = "No se han encontrado álbumes.";
        return;
    }

    filtrados.forEach(({ album, indice }) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta";

        if (album.portada) {
            const imagen = document.createElement("img");
            imagen.src = album.portada;
            imagen.alt = `Portada de ${album.nombre}`;
            imagen.className = "portada";
            tarjeta.appendChild(imagen);
        }

        const titulo = document.createElement("h3");
        titulo.textContent = album.nombre;

        const artista = document.createElement("p");
        artista.textContent = album.artista;

        const nota = document.createElement("p");
        nota.textContent = `Nota: ${calcularMedia(album)}/10`;

        const ver = document.createElement("button");
        ver.textContent = "Ver álbum";
        ver.addEventListener("click", () => {
            albumAbierto = indice;
            mostrarFicha();
        });

        const eliminar = document.createElement("button");
        eliminar.textContent = "Eliminar álbum";
        eliminar.className = "eliminar";

        eliminar.addEventListener("click", () => {
            if (confirm(`¿Eliminar "${album.nombre}"?`)) {
                albums.splice(indice, 1);
                guardar();
                mostrarAlbums();
            }
        });

        tarjeta.append(titulo, artista, nota, ver, eliminar);
        biblioteca.appendChild(tarjeta);
    });
}

function mostrarFicha() {
    const album = albums[albumAbierto];

    if (!album) {
        mostrarAlbums();
        return;
    }

    biblioteca.innerHTML = "";

    const volver = document.createElement("button");
    volver.textContent = "← Volver a mi biblioteca";
    volver.addEventListener("click", mostrarAlbums);

    const titulo = document.createElement("h2");
    titulo.textContent = album.nombre;

    const artista = document.createElement("p");
    artista.textContent = album.artista;

    biblioteca.append(volver, titulo, artista);

    if (album.portada) {
        const imagen = document.createElement("img");
        imagen.src = album.portada;
        imagen.alt = `Portada de ${album.nombre}`;
        imagen.className = "portada";
        biblioteca.appendChild(imagen);
    }

    const nota = document.createElement("p");
    nota.textContent = `Nota del álbum: ${calcularMedia(album)}/10`;
    biblioteca.appendChild(nota);

    const valoradas = album.canciones.filter(c => c.nota !== null).length;
    const progreso = document.createElement("p");
    progreso.textContent =
        `${valoradas} de ${album.canciones.length} canciones valoradas`;
    biblioteca.appendChild(progreso);

    album.canciones.forEach(cancion => {
        const fila = document.createElement("div");
        fila.className = "cancion";

        const nombre = document.createElement("span");
        nombre.textContent = cancion.nombre;

        const botones = document.createElement("div");
        botones.className = "botones-nota";

        [
            { emoji: "🟢", nota: 10 },
            { emoji: "🟡", nota: 5 },
            { emoji: "🔴", nota: 0 }
        ].forEach(opcion => {
            const boton = document.createElement("button");
            boton.textContent = opcion.emoji;
            boton.title = `${opcion.nota}/10`;

            if (cancion.nota === opcion.nota) {
                boton.classList.add("seleccionado");
            }

            boton.addEventListener("click", () => {
                cancion.nota = opcion.nota;
                guardar();
                mostrarFicha();
            });

            botones.appendChild(boton);
        });

        fila.append(nombre, botones);
        biblioteca.appendChild(fila);
    });
}

// Exportar una copia de la colección
botonExportar.addEventListener("click", function () {
    const copia = JSON.stringify(albums, null, 2);
    const archivo = new Blob([copia], { type: "application/json" });
    const enlace = document.createElement("a");

    enlace.href = URL.createObjectURL(archivo);
    enlace.download = "mi-coleccion-musical.json";
    enlace.click();

    URL.revokeObjectURL(enlace.href);
});

// Abrir el selector de archivos para importar
botonImportar.addEventListener("click", function () {
    archivoInput.click();
});

// Recuperar una copia de la colección
archivoInput.addEventListener("change", function () {
    const archivo = archivoInput.files[0];

    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = function () {
        try {
            const copia = JSON.parse(lector.result);

            const valido = Array.isArray(copia) && copia.every(album =>
                typeof album.artista === "string" &&
                typeof album.nombre === "string" &&
                Array.isArray(album.canciones) &&
                album.canciones.every(c =>
                    typeof c.nombre === "string" &&
                    (c.nota === null || [0, 5, 10].includes(c.nota))
                )
            );

            if (!valido) {
                alert("Ese archivo no parece una copia válida.");
                return;
            }

            if (confirm("Esto sustituirá tu colección actual. ¿Quieres continuar?")) {
                albums = copia;
                guardar();
                mostrarAlbums();
                alert("¡Colección recuperada correctamente!");
            }
        } catch {
            alert("No se ha podido leer el archivo.");
        }

        archivoInput.value = "";
    };

    lector.readAsText(archivo);
});

mostrarAlbums();