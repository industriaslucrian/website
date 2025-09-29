/* products.js
   Catálogo de productos para Industrias Lucrian.
   Contiene el array global 'PRODUCTS' utilizado por app.js.
   
   Estructura del producto:
   - id: Identificador único.
   - name: Nombre del producto.
   - price: Precio en pesos colombianos.
   - category: Categoría principal (dama, caballero, nina, nino).
   - image: URL de la imagen del producto.
   - description: Descripción corta.
   - colors: Array de colores disponibles (debe coincidir con colorMap en app.js).
   - sizes: Array de tallas disponibles.
*/

const PRODUCTS = [
    // --- ROPA PARA DAMA (dama) ---
    {
        id: 'D001',
        name: 'Vestido Floral de Verano',
        price: 95000,
        category: 'dama',
        image: 'https://picsum.photos/400/500?random=1&blur=2',
        description: 'Tejido ligero y fresco para los días más cálidos. Ajuste perfecto y cómodo.',
        colors: ['red', 'white', 'pink'],
        sizes: ['XS', 'S', 'M', 'L']
    },
    {
        id: 'D002',
        name: 'Blusa Ejecutiva de Seda',
        price: 80000,
        category: 'dama',
        image: 'https://picsum.photos/400/500?random=2',
        description: 'Elegancia y suavidad. Ideal para la oficina o eventos especiales.',
        colors: ['black', 'white', 'teal'],
        sizes: ['S', 'M', 'L', 'XL']
    },
    {
        id: 'D003',
        name: 'Jean Skinny Clásico',
        price: 110000,
        category: 'dama',
        image: 'https://picsum.photos/400/500?random=3',
        description: 'Ajuste perfecto que realza tu figura. Denim de alta durabilidad.',
        colors: ['blue', 'black', 'gray'],
        sizes: ['28', '30', '32', '34']
    },
    
    // --- ROPA PARA CABALLERO (caballero) ---
    {
        id: 'C001',
        name: 'Camisa Casual Oxford',
        price: 75000,
        category: 'caballero',
        image: 'https://picsum.photos/400/500?random=4&grayscale',
        description: 'Versatilidad para el día a día. Comodidad y estilo garantizados.',
        colors: ['blue', 'white', 'gray'],
        sizes: ['S', 'M', 'L', 'XL']
    },
    {
        id: 'C002',
        name: 'Pantalón Chino Slim Fit',
        price: 125000,
        category: 'caballero',
        image: 'https://picsum.photos/400/500?random=5',
        description: 'Corte moderno y tela elástica. Un básico indispensable.',
        colors: ['navy', 'black', 'green'],
        sizes: ['30', '32', '34', '36']
    },
    {
        id: 'C003',
        name: 'Chaqueta Deportiva',
        price: 150000,
        category: 'caballero',
        image: 'https://picsum.photos/400/500?random=6',
        description: 'Protección ligera contra el viento y la lluvia. Ideal para actividades al aire libre.',
        colors: ['red', 'blue', 'black'],
        sizes: ['M', 'L', 'XL', 'XXL']
    },

    // --- ROPA PARA NIÑA (nina) ---
    {
        id: 'N001',
        name: 'Conjunto de Falda y Blusa',
        price: 65000,
        category: 'nina',
        image: 'https://picsum.photos/400/500?random=7',
        description: 'Diseño divertido y tela suave. Máxima comodidad para jugar.',
        colors: ['pink', 'white'],
        sizes: ['2T', '4T', '6T', '8']
    },
    {
        id: 'N002',
        name: 'Chaqueta con Capucha de Unicornio',
        price: 85000,
        category: 'nina',
        image: 'https://picsum.photos/400/500?random=8&blur',
        description: 'Cremallera frontal y diseño mágico. El abrigo favorito de las pequeñas.',
        colors: ['pink', 'teal'],
        sizes: ['4T', '6T', '8', '10']
    },

    // --- ROPA PARA NIÑO (nino) ---
    {
        id: 'O001',
        name: 'Camiseta Gráfica de Dinosaurios',
        price: 35000,
        category: 'nino',
        image: 'https://picsum.photos/400/500?random=9',
        description: 'Algodón 100% cómodo y resistente. El diseño de dinosaurio que les encanta.',
        colors: ['green', 'blue', 'gray'],
        sizes: ['3T', '5T', '7', '10']
    },
    {
        id: 'O002',
        name: 'Bermuda Cargo de Lona',
        price: 55000,
        category: 'nino',
        image: 'https://picsum.photos/400/500?random=10',
        description: 'Perfecta para aventuras. Múltiples bolsillos para guardar tesoros.',
        colors: ['navy', 'gray'],
        sizes: ['5T', '7', '10', '12']
    },
];

// Si usa TypeScript, puede exportar el tipo:
// export type Product = typeof PRODUCTS[0];