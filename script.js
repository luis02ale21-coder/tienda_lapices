import { db } from "./js/firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
const productos = {
    maped: {
        nombre: "Lápiz escolar Maped Black Peps",
        precio: 12
    },
    bic: {
        nombre: "Lápiz de dibujar BIC Evolution HB",
        precio: 8
    },
    bicolor: {
        nombre: "Lápiz bicolor rojo y grafito",
        precio: 10
    }
};

const carrito = {};

const formatoDinero = cantidad =>
    cantidad.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });

const listaCarrito = document.getElementById("lista-carrito");
const totalElemento = document.getElementById("total");
const contadorElemento = document.getElementById("contador");

// Agregar productos al carrito
document.querySelectorAll(".agregar[data-id]").forEach(boton => {
    boton.addEventListener("click", () => {
        const id = boton.dataset.id;

        carrito[id] = (carrito[id] || 0) + 1;

        actualizarCarrito();

        const textoOriginal = "Agregar al carrito";
        boton.textContent = "¡Agregado!";

        setTimeout(() => {
            boton.textContent = textoOriginal;
        }, 800);
    });
});

// Mostrar productos, cantidades y total
function actualizarCarrito() {
    listaCarrito.innerHTML = "";

    const ids = Object.keys(carrito).filter(
        id => carrito[id] > 0
    );

    let total = 0;
    let cantidadTotal = 0;

    if (ids.length === 0) {
        listaCarrito.innerHTML =
            '<p class="vacio">Tu carrito está vacío.</p>';
    }

    ids.forEach(id => {
        const producto = productos[id];
        const cantidad = carrito[id];
        const subtotal = producto.precio * cantidad;

        total += subtotal;
        cantidadTotal += cantidad;

        const fila = document.createElement("div");
        fila.className = "fila-carrito";

        const informacion = document.createElement("div");

        const nombre = document.createElement("div");
        nombre.className = "nombre-carrito";
        nombre.textContent = producto.nombre;

        const precio = document.createElement("div");
        precio.className = "precio-unitario";
        precio.textContent =
            formatoDinero(producto.precio) + " por pieza";

        informacion.append(nombre, precio);

        const controles = document.createElement("div");
        controles.className = "cantidad-controles";

        const menos = document.createElement("button");
        menos.textContent = "−";
        menos.setAttribute("aria-label", "Quitar una unidad");

        const numero = document.createElement("span");
        numero.textContent = cantidad;

        const mas = document.createElement("button");
        mas.textContent = "+";
        mas.setAttribute("aria-label", "Agregar una unidad");

        menos.addEventListener("click", () => {
            carrito[id]--;

            if (carrito[id] <= 0) {
                delete carrito[id];
            }

            actualizarCarrito();
        });

        mas.addEventListener("click", () => {
            carrito[id]++;
            actualizarCarrito();
        });

        controles.append(menos, numero, mas);

        const subtotalElemento = document.createElement("strong");
        subtotalElemento.textContent = formatoDinero(subtotal);

        const quitar = document.createElement("button");
        quitar.className = "quitar";
        quitar.textContent = "Eliminar";

        quitar.addEventListener("click", () => {
            delete carrito[id];
            actualizarCarrito();
        });

        fila.append(
            informacion,
            controles,
            subtotalElemento,
            quitar
        );

        listaCarrito.appendChild(fila);
    });

    totalElemento.textContent = formatoDinero(total) + " MXN";
    contadorElemento.textContent = cantidadTotal;
}

// Vaciar carrito
document.getElementById("vaciar").addEventListener("click", () => {
    Object.keys(carrito).forEach(id => delete carrito[id]);
    actualizarCarrito();
});

// Generar ticket de compra
document.getElementById("generar-ticket").addEventListener("click", () => {
    const ids = Object.keys(carrito).filter(
        id => carrito[id] > 0
    );

    if (ids.length === 0) {
        alert("Primero agrega al menos un producto al carrito.");
        return;
    }

    const total = ids.reduce((suma, id) => {
        return suma + productos[id].precio * carrito[id];
    }, 0);

    const fecha = new Date().toLocaleString("es-MX");

    const folio = "LAP-" +
        Date.now().toString().slice(-8);

    const filas = ids.map(id => {
        const producto = productos[id];
        const cantidad = carrito[id];
        const subtotal = producto.precio * cantidad;

        return `
            <tr>
                <td>${producto.nombre}</td>
                <td>${cantidad}</td>
                <td>${formatoDinero(producto.precio)}</td>
                <td>${formatoDinero(subtotal)}</td>
            </tr>
        `;
    }).join("");

    const contenido = document.getElementById("contenido-ticket");

    contenido.innerHTML = `
        <div class="ticket-encabezado">
            <h2>✏️ MI TIENDA ONLINE</h2>
            <h3>Ticket de compra</h3>
            <p>Folio: ${folio}</p>
            <p>Fecha: ${fecha}</p>
        </div>

        <table class="tabla-ticket">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Cant.</th>
                    <th>Precio</th>
                    <th>Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${filas}
            </tbody>
        </table>

        <p class="total-ticket">
            Total: ${formatoDinero(total)} MXN
        </p>

        <p>¡Gracias por tu compra!</p>
        <p><small>
            Ticket de demostración. No es comprobante fiscal
            ni confirma un pago.
        </small></p>
    `;

    const seccionTicket = document.getElementById("ticket");
    seccionTicket.hidden = false;

    seccionTicket.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});

// Imprimir o guardar como PDF
document.getElementById("imprimir").addEventListener("click", () => {
    window.print();
});

// Inicializar carrito
// Realizar pedido y guardarlo en Firebase
document.getElementById("realizar-pedido").addEventListener("click", async () => {

    const ids = Object.keys(carrito).filter(
        id => carrito[id] > 0
    );

    if (ids.length === 0) {
        alert("Primero agrega al menos un producto al carrito.");
        return;
    }

    const nombre = document.getElementById("nombre-cliente").value.trim();
    const telefono = document.getElementById("telefono-cliente").value.trim();
    const direccion = document.getElementById("direccion-cliente").value.trim();

    if (!nombre || !telefono || !direccion) {
        alert("Por favor completa tu nombre, teléfono y dirección.");
        return;
    }

    let total = 0;

    const productosPedido = ids.map(id => {

        const producto = productos[id];
        const cantidad = carrito[id];
        const subtotal = producto.precio * cantidad;

        total += subtotal;

        return {
            producto: producto.nombre,
            cantidad: cantidad,
            precio: producto.precio,
            subtotal: subtotal
        };
    });

    try {

        const pedido = await addDoc(
            collection(db, "pedidos"),
            {
                cliente: nombre,
                telefono: telefono,
                direccion: direccion,
                productos: productosPedido,
                total: total,
                estado: "Pendiente",
                fecha: serverTimestamp()
            }
        );

        alert(
            "¡Pedido realizado correctamente!\n\n" +
            "Número de pedido: " + pedido.id
        );

        Object.keys(carrito).forEach(
            id => delete carrito[id]
        );

        actualizarCarrito();

        document.getElementById("nombre-cliente").value = "";
        document.getElementById("telefono-cliente").value = "";
        document.getElementById("direccion-cliente").value = "";

    } catch (error) {

        console.error("Error al guardar el pedido:", error);

        alert(
            "Ocurrió un error al guardar el pedido. " +
            "Revisa la consola."
        );
    }
});
actualizarCarrito();
