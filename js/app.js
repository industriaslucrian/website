
/* app.js
   Versión con mejora en la carga de imágenes de galería para aceptar múltiples formatos
   y variantes de ruta (por ejemplo: img/D001-1.jpg, D001-1.jpg, imgD001-1.jpg, .png, .webp, etc.)
   Mantengo el resto de funcionalidades (carrito, galería, cierre en home, etc.).
*/

(() => {
  // --- Configuración ---
  const STORAGE_KEY = 'lucrian_cart_v1';
  const freeShippingThreshold = 200000;
  const whatsappNumber = "573012034125"; 

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

  // Protección para evitar abrir->cerrar inmediato del carrito en móviles
  let lastToggleAt = 0;
  const TOGGLE_IGNORE_MS = 300;

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

    const colorLabel = document.createElement('label');
    colorLabel.className = 'block text-lg font-semibold mt-4 text-gray-800';
    colorLabel.textContent = 'Selecciona Color:';
    modal.appendChild(colorLabel);

    const colorContainer = document.createElement('div');
    colorContainer.className = 'mt-2 flex items-center gap-3 flex-wrap';
    modal.appendChild(colorContainer);

    const colorSelect = document.createElement('input'); 
    colorSelect.type = 'hidden';
    colorSelect.value = (colorOptions && colorOptions[0]) || '';

    (colorOptions || []).forEach(col => {
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
        colorContainer.querySelectorAll('button').forEach(b => b.classList.remove('ring-2','ring-purple-500', 'border-purple-500'));
        btn.classList.add('ring-2','ring-purple-500', 'border-purple-500');
      });
      colorContainer.appendChild(btn);
    });

    const sizeLabel = document.createElement('label');
    sizeLabel.className = 'block text-lg font-semibold mt-6 text-gray-800';
    sizeLabel.textContent = 'Selecciona Talla:';
    modal.appendChild(sizeLabel);

    const sizeSelect = document.createElement('select');
    sizeSelect.className = 'w-full mt-2 px-4 py-3 border border-gray-300 rounded-xl focus:ring-purple-500 focus:border-purple-500';
    (sizeOptions || []).forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sizeSelect.appendChild(opt);
    });
    modal.appendChild(sizeSelect);

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
      const selectedColor = colorSelect.value || ((colorOptions && colorOptions[0]) || 'blue');
      const selectedSize = sizeSelect.value || ((sizeOptions && sizeOptions[0]) || 'M');
      addToCart(id, name, price, selectedColor, selectedSize);
      backdrop.remove();
    });
    
    actions.appendChild(cancelBtn);
    actions.appendChild(addBtn);
    modal.appendChild(actions);
    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    setTimeout(()=> { sizeSelect.focus(); }, 50);
  }

  // --- Cart operations ---
  function addToCart(id, name, price, color = 'blue', size = '') {
    const uniqueKey = `${id}-${size}-${color}`;
    const existing = cart.find(i => i.uniqueKey === uniqueKey);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ 
        uniqueKey: uniqueKey,
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

    message += "\nPor favor, confírmame el método de pago \n¡Gracias!";

    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappLink, '_blank');
  }

  function procesarPagoEnLinea() {
    if (cart.length === 0) {
        createNotif("¡Tu carrito está vacío! Agrega productos antes de pagar en línea.");
        return;
    }
    const paymentLink = "https://tu-pasarela.com/checkout?amount=" + cartTotal;
    createNotif(`Redirigiendo a la pasarela de pago... Total: ${formatPrice(cartTotal)}`);
    window.open(paymentLink, '_blank');
  }
  window.procesarPagoEnLinea = procesarPagoEnLinea;

  // --- Contacto Directo WhatsApp ---
  function contactWhatsApp() {
    const message = encodeURIComponent("¡Hola! Tengo una pregunta sobre los productos.");
    const whatsappLink = `https://wa.me/${whatsappNumber}?text=${message}`;
    window.open(whatsappLink, '_blank');
  }

  // --- Renderizado Dinámico de Productos ---
 function renderProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card bg-white rounded-3xl p-6 shadow-xl flex flex-col justify-between';

  // Elementos
  const top = document.createElement('div');
  top.className = 'mb-4';

  const imgEl = document.createElement('img');
  imgEl.alt = (product.name || '').replace(/"/g, '&quot;');
  imgEl.className = 'w-full h-64 object-cover rounded-2xl mb-4 hover:shadow-2xl transition-shadow duration-300';
  imgEl.style.display = 'block'; // por si se oculta luego

  // Determinar src inicial: preferir product.images[0], si no usar product.image
  const preferredSrc = (Array.isArray(product.images) && product.images.length) ? product.images[0] : (product.image || '');
  if (preferredSrc) imgEl.src = preferredSrc;

  // Click para abrir galería
  imgEl.addEventListener('click', () => {
    if (typeof openGallery === 'function') openGallery(product.id);
  });

  // Manejo robusto de error de carga:
  // 1) si hay product.image y aún no lo probamos, usarlo.
  // 2) si hay loadGalleryImages disponible, pedirle las rutas existentes y usar la primera válida.
  // 3) si nada funciona, ocultar la imagen para no mostrar broken icon.
  imgEl.addEventListener('error', function handleImgError() {
    // evitar loops
    imgEl.removeEventListener('error', handleImgError);

    // Si existe product.image y es distinto al src actual, probarlo
    const fallback = product.image || '';
    if (fallback && imgEl.src !== fallback) {
      imgEl.src = fallback;
      // volver a añadir listener por si falla también
      imgEl.addEventListener('error', function secondTry() {
        imgEl.removeEventListener('error', secondTry);
        // siguiente paso: intentar loadGalleryImages si existe
        tryLoadGalleryFirstImageOrHide();
      });
      return;
    }

    // Si no hay fallback directo, intentar con loadGalleryImages (si está definida)
    tryLoadGalleryFirstImageOrHide();
  });

  function tryLoadGalleryFirstImageOrHide() {
    if (typeof loadGalleryImages === 'function') {
      loadGalleryImages(product, 6).then(images => {
        if (Array.isArray(images) && images.length > 0) {
          // Si la primera imagen es igual a la que falló, buscamos la siguiente válida
          if (images[0] && images[0] !== imgEl.src) {
            imgEl.src = images[0];
            // si por alguna razón vuelve a fallar, ocultaremos (no añadimos más listeners)
          } else if (images.length > 1) {
            imgEl.src = images[1];
          } else {
            imgEl.style.display = 'none';
          }
        } else {
          imgEl.style.display = 'none';
        }
      }).catch(err => {
        console.warn('loadGalleryImages error:', err);
        imgEl.style.display = 'none';
      });
    } else {
      // No hay función para intentar otras rutas: ocultar la imagen
      imgEl.style.display = 'none';
    }
  }

  // Si no hay src inicial y hay product.image, setearlo (esto cubre el caso product.images vacío)
  if (!imgEl.src && product.image) {
    imgEl.src = product.image;
  }

  // Título y descripción
  const title = document.createElement('h3');
  title.className = 'text-xl font-bold text-gray-800 mb-2';
  title.textContent = product.name || '';

  const desc = document.createElement('p');
  desc.className = 'text-sm text-gray-500 h-10 overflow-hidden';
  desc.textContent = product.description || '';

  top.appendChild(imgEl);
  top.appendChild(title);
  top.appendChild(desc);

  // Pie con precio y botón
  const bottom = document.createElement('div');

  const priceEl = document.createElement('div');
  priceEl.className = 'text-3xl font-extrabold text-purple-600 mb-4';
  priceEl.textContent = formatPrice(product.price || 0);

  const btn = document.createElement('button');
  btn.className = 'w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-2xl font-semibold hover:shadow-lg transition-all duration-300';
  btn.type = 'button';
  btn.textContent = 'Añadir al Carrito';
  btn.addEventListener('click', () => {
    if (typeof openProductOptions === 'function') openProductOptions(product.id);
  });

  bottom.appendChild(priceEl);
  bottom.appendChild(btn);

  // Montaje
  card.appendChild(top);
  card.appendChild(bottom);

  return card;
}
  
  function loadProducts() {
    if (typeof PRODUCTS === 'undefined' || !Array.isArray(PRODUCTS)) {
        console.error("El catálogo de productos (PRODUCTS) no está definido o no es un array.");
        return;
    }

    const categories = ['dama', 'caballero', 'nina', 'nino'];
    categories.forEach(cat => {
      const container = document.getElementById(`${cat}-products`);
      if (container) {
        container.innerHTML = '';
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
    lastToggleAt = Date.now();
  }

  function closeCartIfOpen() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
      lastToggleAt = Date.now();
    }
  }

  function showPage(pageId) {
    document.querySelectorAll('.category-page').forEach(page => {
      page.classList.remove('active');
    });

    const targetId = pageId.endsWith('-page') ? pageId : `${pageId}-page`;
    const targetPage = document.getElementById(targetId);
    
    if (targetPage) {
      targetPage.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (targetId === 'home-page') {
        closeCartIfOpen();
      }
    } else {
        document.getElementById('home-page')?.classList.add('active');
    }
  }

  function scrollToSection(sectionId) {
    if (document.getElementById('home-page')?.classList.contains('active')) {
      const element = document.getElementById(sectionId);
      if (!element) return;
      const headerHeight = 120;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerHeight;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  }

  // --- GALERÍA: carga de imágenes más tolerante a nombres ---
  function loadGalleryImages(product, maxAttempts = 6) {
    return new Promise((resolve) => {
      // 1) Si existe product.images (array), úsalo sin forzar prefijos.
      if (Array.isArray(product.images) && product.images.length) {
        const candidates = [];
        product.images.forEach(u => {
          if (!u) return;
          // Si es URL absoluta, la dejamos
          if (/^https?:\/\//i.test(u)) {
            candidates.push(u);
          } else {
            // rutas relativas: añadimos variantes útiles (tal cual, con img/, y sin slash)
            const clean = u.replace(/^\/*/, ''); // elimina slash inicial
            candidates.push(clean);
            if (!clean.startsWith('img/')) candidates.push('img/' + clean);
            // si el archivo está en raíz con prefijo img (imgD001-1.jpg)
            if (!clean.startsWith('img')) candidates.push('img' + clean);
          }
        });
        // eliminar duplicados
        const uniq = Array.from(new Set(candidates));
        // Intentamos cargar estas rutas y devolvemos las que existan
        attemptLoadUrls(uniq).then(found => {
          if (found.length) resolve(found);
          else if (product.image) resolve([product.image]);
          else resolve([]);
        });
        return;
      }

      // 2) Si no hay product.images, intentamos varias convenciones:
      const id = String(product.id || '').trim();
      const idLower = id.toLowerCase();
      const exts = ['jpg','png','jpeg','webp'];
      const candidates = [];

      for (let i = 1; i <= maxAttempts; i++) {
        exts.forEach(ext => {
          candidates.push(`img/${id}-${i}.${ext}`);
          candidates.push(`${id}-${i}.${ext}`);
          candidates.push(`img${id}-${i}.${ext}`); // imgD001-1.jpg (sin slash)
          // lowercase id variants
          candidates.push(`img/${idLower}-${i}.${ext}`);
          candidates.push(`${idLower}-${i}.${ext}`);
          candidates.push(`img${idLower}-${i}.${ext}`);
        });
      }

      // also try single-file patterns (no -N)
      exts.forEach(ext => {
        candidates.push(`img/${id}.${ext}`);
        candidates.push(`${id}.${ext}`);
        candidates.push(`img${id}.${ext}`);
        candidates.push(`img/${idLower}.${ext}`);
        candidates.push(`${idLower}.${ext}`);
        candidates.push(`img${idLower}.${ext}`);
      });

      // eliminar duplicados
      const uniqCandidates = Array.from(new Set(candidates));

      attemptLoadUrls(uniqCandidates).then(loaded => {
        if (loaded.length) {
          resolve(loaded);
        } else {
          if (product.image) resolve([product.image]);
          else resolve([]);
        }
      });
    });

    // Helper: intenta cargar varias URLs (Image) y devuelve las que existan (en el mismo orden)
    function attemptLoadUrls(urls) {
      return new Promise((res) => {
        const found = [];
        let checked = 0;
        const total = urls.length;
        if (total === 0) {
          res([]);
          return;
        }
        urls.forEach(url => {
          // Si ya es URL absoluta, la probamos tal cual
          const img = new Image();
          img.onload = () => {
            found.push(url);
            check();
          };
          img.onerror = () => {
            check();
          };
          img.src = url;
        });
        function check() {
          checked++;
          // Esperamos a comprobar todas, luego devolvemos found en orden de aparición filtrado por existencia
          if (checked === total) {
            res(found);
          }
        }
      });
    }
  }

  // --- Abrir galería modal (lightbox) ---
  function openGallery(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    if (document.querySelector('.gallery-backdrop')) return;

    loadGalleryImages(product, 6).then(images => {
      if (!images || images.length === 0) {
        createNotif('No se encontraron imágenes para este producto.');
        return;
      }

      let currentIndex = 0;
      const backdrop = document.createElement('div');
      backdrop.className = 'gallery-backdrop';
      backdrop.tabIndex = -1;

      const modal = document.createElement('div');
      modal.className = 'gallery-modal';

      const mainWrap = document.createElement('div');
      mainWrap.className = 'gallery-main';

      const imgEl = document.createElement('img');
      imgEl.src = images[currentIndex];
      imgEl.alt = product.name;
      imgEl.className = 'gallery-main-img';
      mainWrap.appendChild(imgEl);

      const controls = document.createElement('div');
      controls.className = 'gallery-controls';
      controls.innerHTML = `
        <div style="display:flex; align-items:center;">
          <button type="button" class="gallery-prev" aria-label="Anterior">&larr;</button>
        </div>
        <div style="display:flex; align-items:center;">
          <button type="button" class="gallery-next" aria-label="Siguiente">&rarr;</button>
        </div>
      `;
      mainWrap.appendChild(controls);

      const thumbs = document.createElement('div');
      thumbs.className = 'gallery-thumbs';
      images.forEach((src, idx) => {
        const t = document.createElement('div');
        t.className = 'gallery-thumb' + (idx === 0 ? ' active' : '');
        const im = document.createElement('img');
        im.src = src;
        im.alt = product.name + ' ' + (idx + 1);
        t.appendChild(im);
        t.addEventListener('click', () => {
          currentIndex = idx;
          updateMain();
        });
        thumbs.appendChild(t);
      });

      modal.appendChild(mainWrap);
      modal.appendChild(thumbs);
      backdrop.appendChild(modal);
      document.body.appendChild(backdrop);

      function updateMain() {
        imgEl.classList.remove('zoomed');
        imgEl.src = images[currentIndex];
        thumbs.querySelectorAll('.gallery-thumb').forEach((th, i) => {
          th.classList.toggle('active', i === currentIndex);
        });
      }

      function next() {
        currentIndex = (currentIndex + 1) % images.length;
        updateMain();
      }
      function prev() {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        updateMain();
      }

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) {
          backdrop.remove();
        }
      });
      controls.querySelector('.gallery-next')?.addEventListener('click', next);
      controls.querySelector('.gallery-prev')?.addEventListener('click', prev);

      imgEl.addEventListener('click', () => {
        imgEl.classList.toggle('zoomed');
      });

      function keyHandler(e) {
        if (e.key === 'Escape') backdrop.remove();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      }
      document.addEventListener('keydown', keyHandler);

      const observer = new MutationObserver(() => {
        if (!document.body.contains(backdrop)) {
          document.removeEventListener('keydown', keyHandler);
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true });
    });
  }

  // --- EXPOSICIÓN GLOBAL ---
  window.openProductOptions = openProductOptions;
  window.addToCart = addToCart;
  window.toggleCart = toggleCart;
  window.checkout = checkout;
  window.contactWhatsApp = contactWhatsApp;
  window.showPage = showPage;
  window.scrollToSection = scrollToSection;
  window.updateQuantity = updateQuantity;
  window.removeFromCart = removeFromCart;
  window.openGallery = openGallery;
  window.procesarPagoEnLinea = procesarPagoEnLinea;

  // --- INICIALIZACIÓN INMEDIATA ---
  try {
    const initFlag = localStorage.getItem(STORAGE_KEY + '_initialized');
    if (!initFlag) {
      if (Array.isArray(cart) && cart.length > 0) {
        cart = [];
        saveCart();
      }
      localStorage.setItem(STORAGE_KEY + '_initialized', '1');
    }
  } catch (e) {
    console.warn('Error gestionando flag de inicialización:', e);
  }

  loadProducts();
  updateCartDisplay();

  // --- EVENTOS DEL DOM ---
  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('menu-toggle')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('hidden');
    });
    document.getElementById('mobile-productos-toggle')?.addEventListener('click', function() {
      const submenu = document.getElementById('mobile-productos-menu');
      const arrow = this.querySelector('svg');
      submenu?.classList.toggle('hidden');
      arrow?.classList.toggle('rotate-180');
    });

    document.getElementById('contact-form')?.addEventListener('submit', function(e){
      e.preventDefault();
      createNotif('¡Mensaje enviado! Nos contactaremos contigo pronto 📧');
      this.reset();
    });

    document.getElementById('cart-overlay')?.addEventListener('click', toggleCart);

    // Cierre del carrito al tocar la página principal (pointerdown cubre touch)
    document.addEventListener('pointerdown', (e) => {
      try {
        const home = document.getElementById('home-page');
        const sidebar = document.getElementById('cart-sidebar');
        if (!home || !home.classList.contains('active')) return;
        if (!sidebar || !sidebar.classList.contains('open')) return;
        if (Date.now() - lastToggleAt < TOGGLE_IGNORE_MS) return;
        const target = e.target;
        if (target.closest && target.closest('#cart-sidebar')) return;
        if (target.closest && (target.closest('button')?.getAttribute('onclick')?.includes('toggleCart') || target.closest('#menu-toggle') )) return;
        if (target.closest && (target.closest('.product-modal-backdrop') || target.closest('.gallery-backdrop'))) return;
        closeCartIfOpen();
      } catch (err) {
        console.warn('Error en handler de cierre de carrito:', err);
      }
    });
  });

})();