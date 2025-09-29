/* app.js
   CORRECCIÓN CLAVE: Las funciones (showPage, openProductOptions, etc.) ahora se exponen
   al objeto global 'window' inmediatamente. Esto soluciona los problemas de los
   botones 'onclick' y la carga tardía de productos.
*/

(() => {
  // --- Configuración ---
  const STORAGE_KEY = 'lucrian_cart_v1';
  const freeShippingThreshold = 200000;
  // PASO 13: Revisa y cambia tu número de WhatsApp aquí
  const whatsappNumber = "573012034125"; 

  // Mapa de colores utilizado para los selectores (debe coincidir con products.js)
  const colorMap = {
    red: ['#f97316','#fb7185'],
    pink: ['#f472b6','#a78bfa'],
    white: ['#f3f4f6','#f9fafb'],
    black: ['#111827','#374151'],
    navy: ['#1e3a8a','#3b82f6'],
    gray: ['#6b7280','#9ca3af'],
    green: ['#10b981','#34d399'],
    blue: ['#60a5fa','#6366f1'],
    teal: ['#14b8a6','#2dd4bf'],
  };

  // --- Estado ---
  let cart = loadCart();
  let cartTotal = 0;

  // --- Utilidades ---
  function loadCart() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Error cargando carrito:', e);
      return [];
    }
  }

  function saveCart() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Error guardando carrito:', e);
    }
  }

  function formatPrice(n) {
    // Asegura el formato de peso colombiano (miles con punto, sin decimales)
    return `$${Number(n).toLocaleString('es-CO')}`;
  }

  function createNotif(message) {
    const notification = document.createElement('div');
    notification.setAttribute('role','status');
    notification.setAttribute('aria-live','polite');
    notification.className = 'fixed top-24 right-6 bg-green-500 text-white px-6 py-3 rounded-2xl shadow-lg z-50 transform translate-x-full transition-transform duration-300';
    notification.textContent = message;
    document.body.appendChild(notification);
    requestAnimationFrame(()=> notification.classList.remove('translate-x-full'));
    setTimeout(()=> {
      notification.classList.add('translate-x-full');
      setTimeout(()=> notification.remove(), 400);
    }, 3000);
  }

  // --- Modal for selecting size/color ---
  function openProductOptions(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    const { id, name, price, colors: colorOptions, sizes: sizeOptions } = product;
    
    // Build modal DOM
    const backdrop = document.createElement('div');
    backdrop.className = 'product-modal-backdrop';
    backdrop.tabIndex = -1;

    const modal = document.createElement('div');
    modal.className = 'product-modal';

    const title = document.createElement('h3');
    title.className = 'text-2xl font-bold text-gradient mb-4';
    title.textContent = `${name}`;
    modal.appendChild(title);
    
    const priceDisplay = document.createElement('p');
    priceDisplay.className = 'text-xl font-semibold text-gray-700 mb-6';
    priceDisplay.textContent = formatPrice(price);
    modal.appendChild(priceDisplay);


    // Colors
    const colorLabel = document.createElement('label');
    colorLabel.className = 'block text-lg font-semibold mt-4 text-gray-800';
    colorLabel.textContent = 'Selecciona Color:';
    modal.appendChild(colorLabel);

    const colorContainer = document.createElement('div');
    colorContainer.className = 'mt-2 flex items-center gap-3 flex-wrap';
    modal.appendChild(colorContainer);

    const colorSelect = document.createElement('input'); 
    colorSelect.type = 'hidden';
    colorSelect.value = colorOptions[0] || '';

    colorOptions.forEach(col => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 focus:outline-none hover:border-purple-500';
      btn.style.border = '1px solid #e5e7eb';
      
      const sw = document.createElement('span');
      sw.className = 'swatch-small';
      const colors = colorMap[col] || ['#ddd','#bbb'];
      sw.style.background = `linear-gradient(90deg, ${colors[0]}, ${colors[1]})`;
      btn.appendChild(sw);
      
      const txt = document.createElement('span');
      txt.textContent = col.charAt(0).toUpperCase() + col.slice(1);
      btn.appendChild(txt);

      if (col === colorSelect.value) {
        btn.classList.add('ring-2','ring-purple-500', 'border-purple-500');
      }

      btn.addEventListener('click', () => {
        colorSelect.value = col;
        // update visual selection
        colorContainer.querySelectorAll('button').forEach(b => b.classList.remove('ring-2','ring-purple-500', 'border-purple-500'));
        btn.classList.add('ring-2','ring-purple-500', 'border-purple-500');
      });
      colorContainer.appendChild(btn);
    });

    // Sizes
    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'block text-lg font-semibold mt-6 text-gray-800';
    sizeLabel.textContent = 'Selecciona Talla:';
    modal.appendChild(sizeLabel);

    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500';
    sizeOptions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sizeSelect.appendChild(opt);
    });
    modal.appendChild(sizeSelect);

    // Buttons
    const actions = document.createElement('div');
    actions.className = 'mt-8 flex gap-3 justify-end';
    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'px-6 py-3 rounded-2xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors';
    cancelBtn.textContent = 'Cancelar';
    cancelBtn.addEventListener('click', () => backdrop.remove());
    
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 text-white font-semibold hover:shadow-lg transition-all duration-300';
    addBtn.textContent = 'Agregar al carrito';
    
    addBtn.addEventListener('click', () => {
      const selectedColor = colorSelect.value || (colorOptions[0] || 'blue');
      const selectedSize = sizeSelect.value || (sizeOptions[0] || 'M');
      addToCart(id, name, price, selectedColor, selectedSize);
      backdrop.remove();
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(addBtn);
    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    // accessibility: focus first actionable
    setTimeout(()=> { sizeSelect.focus(); }, 50);
  }

  // --- Cart operations ---
  function addToCart(id, name, price, color = 'blue', size = '') {
    // group items by id + size + color
    const uniqueKey = `${id}-${size}-${color}`;
    
    const existing = cart.find(i => i.uniqueKey === uniqueKey);
    
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ 
        uniqueKey: uniqueKey, // Nuevo campo para agrupar
        id: id,
        name: String(name), 
        price: Number(price), 
        quantity: 1, 
        color: color, 
        size: String(size) 
      });
    }
    
    saveCart();
    updateCartDisplay();
    createNotif(`${name} (${size}, ${color}) agregado al carrito! 🎉`);
  }

  function updateQuantity(uniqueKey, change) {
    const item = cart.find(i => i.uniqueKey === uniqueKey);
    if (!item) return;

    item.quantity += change;
    if (item.quantity <= 0) {
      removeFromCart(uniqueKey);
    } else {
      saveCart();
      updateCartDisplay();
    }
  }

  function removeFromCart(uniqueKey) {
    cart = cart.filter(i => i.uniqueKey !== uniqueKey);
    saveCart();
    updateCartDisplay();
  }
  
  function updateCartDisplay() {
    const cartList = document.getElementById('cart-list');
    const cartTotalDisplay = document.getElementById('cart-total');
    const cartCountDisplay = document.getElementById('cart-count');
    const mobileCartCountDisplay = document.getElementById('mobile-cart-count');
    const emptyCartDisplay = document.getElementById('empty-cart');
    const cartFooter = document.getElementById('cart-footer');
    const shippingNotice = document.getElementById('shipping-notice');
    const shippingRemaining = document.getElementById('shipping-remaining');
    const remainingAmount = document.getElementById('remaining-amount');

    cartTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

    cartTotalDisplay.textContent = formatPrice(cartTotal);
    cartList.innerHTML = '';
    
    if (totalItems === 0) {
      emptyCartDisplay.classList.remove('hidden');
      cartList.classList.add('hidden');
      cartCountDisplay.classList.add('hidden');
      mobileCartCountDisplay.classList.add('hidden');
      cartFooter.classList.add('hidden');
    } else {
      emptyCartDisplay.classList.add('hidden');
      cartList.classList.remove('hidden');
      cartCountDisplay.classList.remove('hidden');
      mobileCartCountDisplay.classList.remove('hidden');
      cartFooter.classList.remove('hidden');
      cartCountDisplay.textContent = totalItems;
      mobileCartCountDisplay.textContent = totalItems;
      
      // Render items
      cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center space-x-4 p-4 border rounded-2xl bg-white shadow-sm';
        itemElement.innerHTML = `
          <div class="swatch-small w-10 h-10 rounded-lg" style="background: linear-gradient(90deg, ${colorMap[item.color] ? colorMap[item.color][0] : '#ddd'}, ${colorMap[item.color] ? colorMap[item.color][1] : '#bbb'});"></div>
          <div class="flex-1">
            <h4 class="font-semibold text-gray-800">${item.name}</h4>
            <p class="text-sm text-gray-500">Talla: ${item.size} | Color: ${item.color.charAt(0).toUpperCase() + item.color.slice(1)}</p>
            <p class="font-bold text-sm text-purple-600">${formatPrice(item.price)}</p>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="updateQuantity('${item.uniqueKey}', -1)" class="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">-</button>
            <span class="font-semibold w-6 text-center">${item.quantity}</span>
            <button onclick="updateQuantity('${item.uniqueKey}', 1)" class="w-8 h-8 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition-colors">+</button>
          </div>
          <button onclick="removeFromCart('${item.uniqueKey}')" class="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        `;
        cartList.appendChild(itemElement);
      });
      
      // Shipping notice
      if (cartTotal >= freeShippingThreshold) {
        shippingNotice.classList.remove('hidden');
        shippingRemaining.classList.add('hidden');
      } else {
        shippingNotice.classList.add('hidden');
        shippingRemaining.classList.remove('hidden');
        const remaining = freeShippingThreshold - cartTotal;
        remainingAmount.textContent = formatPrice(remaining);
      }
    }
  }
  
  // --- Botón de Pago (Mejorado) ---
  function checkout() {
    if (cart.length === 0) {
      createNotif("¡Tu carrito está vacío! Agrega productos antes de pagar.");
      return;
    }

    let message = "¡Hola! Quisiera realizar un pedido con los siguientes productos:\n\n";
    
    cart.forEach((item, index) => {
      message += `${index + 1}. ${item.name} \n`;
      message += `   * Cantidad: ${item.quantity}\n`;
      message += `   * Opciones: Talla ${item.size}, Color ${item.color.charAt(0).toUpperCase() + item.color.slice(1)}\n`;
      message += `   * Subtotal: ${formatPrice(item.price * item.quantity)}\n`;
    });
    
    message += "\n----------------------------------------\n";
    message += `🛒 Total a pagar: ${formatPrice(cartTotal)}\n`;
    
    if (cartTotal >= freeShippingThreshold) {
      message += "🎉 ¡Envío gratis aplicado!\n";
    } else {
      message += "🚚 Envío no incluido. Por favor, confírmame el costo de envío.\n";
    }

    message += "\nPor favor, confírmame el método de pago y los datos de envío (Nombre, Dirección, Ciudad, Teléfono).\n¡Gracias!";

    // Codifica el mensaje para la URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    
    window.open(whatsappLink, '_blank');
  }
  // --- Nueva función para Pago en Línea ---
function procesarPagoEnLinea() {
    if (cart.length === 0) {
        createNotif("¡Tu carrito está vacío! Agrega productos antes de pagar en línea.");
        return;
    }

    // PASO 1: Reemplaza este enlace de ejemplo con tu URL real de pasarela de pago (PayU, Epayco, etc.)
    const paymentLink = "https://tu-pasarela.com/checkout?amount=" + cartTotal;
    
    // PASO 2: (Opcional) Puedes añadir una lógica de pre-registro aquí si tu pasarela lo requiere.

    // Notificación al usuario
    createNotif(`Redirigiendo a la pasarela de pago... Total: ${formatPrice(cartTotal)}`);

    // Abre el enlace en una nueva pestaña (simulando la pasarela)
    window.open(paymentLink, '_blank');

    // OPCIONAL: Podrías limpiar el carrito aquí si la pasarela confirma el pago,
    // pero generalmente se limpia después de la confirmación real del webhook.
    // cart = [];
    // saveCart();
    // updateCartDisplay();
}

// Asegúrese de que esta nueva función se exporte globalmente
window.procesarPagoEnLinea = procesarPagoEnLinea;
  // --- Contacto Directo WhatsApp ---
  function contactWhatsApp() {
    const message = encodeURIComponent("¡Hola! Tengo una pregunta sobre la ropa de Industrias Lucrian.");
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappLink, '_blank');
  }

  // --- Renderizado Dinámico de Productos ---
  function renderProductCard(product) {
    const card = document.createElement('div');
    // Usamos la misma clase de diseño que las tarjetas de categoría
    card.className = 'product-card bg-white rounded-3xl p-6 shadow-xl flex flex-col justify-between';
    card.innerHTML = `
      <div class="mb-4">
        <img src="${product.image}" alt="${product.name}" class="w-full h-64 object-cover rounded-2xl mb-4 hover:shadow-2xl transition-shadow duration-300">
        <h3 class="text-xl font-bold text-gray-800 mb-2">${product.name}</h3>
        <p class="text-sm text-gray-500 h-10 overflow-hidden">${product.description}</p>
      </div>
      <div>
        <div class="text-3xl font-extrabold text-purple-600 mb-4">${formatPrice(product.price)}</div>
        <button onclick="openProductOptions('${product.id}')" class="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300">
            Añadir al Carrito
        </button>
      </div>
    `;
    return card;
  }
  
  function loadProducts() {
    // Aseguramos que PRODUCTS esté disponible (de products.js)
    if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) {
        console.error("El catálogo de productos (PRODUCTS) no está definido o no es un array.");
        return;
    }

    const categories = ['dama', 'caballero', 'nina', 'nino'];
    
    categories.forEach(cat => {
      const container = document.getElementById(`${cat}-products`);
      if (container) {
        container.innerHTML = ''; // Limpia el mensaje de "cargando"
        
        const products = PRODUCTS.filter(p => p.category === cat);
        
        if (products.length > 0) {
          products.forEach(product => {
            container.appendChild(renderProductCard(product));
          });
        } else {
          container.innerHTML = `<p class="text-center md:col-span-full text-gray-500 py-10">No hay productos disponibles en esta categoría por el momento.</p>`;
        }
      }
    });
  }

  // --- Navegación y Scroll ---
  function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    } else {
      sidebar.classList.add('open');
      overlay.classList.remove('hidden');
    }
  }

  function showPage(pageId) {
    document.querySelectorAll('.category-page').forEach(page => {
      // Oculta todas las páginas, incluyendo home-page
      page.classList.remove('active');
    });

    const targetId = pageId.endsWith('-page') ? pageId : `${pageId}-page`;
    const targetPage = document.getElementById(targetId);
    
    if (targetPage) {
      targetPage.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll al inicio de la página
    } else {
        // Si la página no se encuentra (e.g., contacto en home), solo muestra home
        document.getElementById('home-page')?.classList.add('active');
    }
  }

  function scrollToSection(sectionId) {
    // Solo aplica el scroll si estamos en la página de inicio
    if (document.getElementById('home-page')?.classList.contains('active')) {
      const element = document.getElementById(sectionId);
      if (!element) return;
      
      const headerHeight = 120; // Altura del encabezado fijo (aproximado)
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }

  // --- EXPOSICIÓN GLOBAL DE FUNCIONES (El FIX) ---
  // Hacemos las funciones accesibles desde los atributos onclick del HTML inmediatamente.
  window.openProductOptions = openProductOptions;
  window.addToCart = addToCart;
  window.toggleCart = toggleCart;
  window.checkout = checkout;
  window.contactWhatsApp = contactWhatsApp;
  window.showPage = showPage;
  window.scrollToSection = scrollToSection;
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;
  
  // --- INICIALIZACIÓN INMEDIATA ---
  // Ya que los scripts se cargan al final del <body>, el DOM está listo.
  loadProducts(); // Carga de productos resuelta.
  updateCartDisplay();

  // --- EVENTOS DEL DOM (Aseguramos que el DOM esté listo) ---
  document.addEventListener('DOMContentLoaded', () => {
    // Mobile toggles
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
    document.getElementById('mobile-productos-toggle')?.addEventListener('click', function() {
      const submenu = document.getElementById('mobile-productos-menu');
      const arrow = this.querySelector('svg');
      submenu?.classList.toggle('hidden');
      arrow?.classList.toggle('rotate-180');
    });

    // Contact form
    document.getElementById('contact-form')?.addEventListener('submit', function(e){
      e.preventDefault();
      createNotif('¡Mensaje enviado! Nos contactaremos contigo pronto 📧');
      this.reset();
    });

    // overlay
    document.getElementById('cart-overlay')?.addEventListener('click', toggleCart);
  });

})();