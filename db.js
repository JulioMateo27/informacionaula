/**
 * INFORMAULA — Mi Blog Docente
 * db.js — Módulo desacoplado de abstracción y persistencia (IndexedDB)
 * 
 * Diseñado con interfaz agnóstica para permitir sustituir fácilmente 
 * el almacenamiento local del navegador por llamadas a una API REST / Supabase.
 */

const DB_NAME = 'InformAulaDB';
const DB_VERSION = 1;

class StorageService {
  constructor() {
    this.db = null;
    this._initPromise = this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Almacén: Artículos (publicaciones)
        if (!db.objectStoreNames.contains('articles')) {
          const articleStore = db.createObjectStore('articles', { keyPath: 'id' });
          articleStore.createIndex('status', 'status', { unique: false });
          articleStore.createIndex('subject', 'subject', { unique: false });
          articleStore.createIndex('grade', 'grade', { unique: false });
          articleStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Comentarios
        if (!db.objectStoreNames.contains('comments')) {
          const commentStore = db.createObjectStore('comments', { keyPath: 'id' });
          commentStore.createIndex('articleId', 'articleId', { unique: false });
          commentStore.createIndex('status', 'status', { unique: false }); // pending, approved, rejected, spam
          commentStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Biblioteca Multimedia
        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'id' });
          mediaStore.createIndex('category', 'category', { unique: false });
          mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Almacén: Configuración y Sesión Demo
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = async (event) => {
        this.db = event.target.result;
        await this._seedInitialData();
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Error al inicializar IndexedDB:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // ── Métodos internos sin await _initPromise (evitan deadlock en seed) ──
  _countRaw(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  _putRaw(storeName, item) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async _seedInitialData() {
    const articlesCount = await this._countRaw('articles');
    if (articlesCount === 0) {
      // Sembrar datos educativos iniciales
      const defaultArticles = [
        {
          id: 'art-ciclo-agua',
          title: 'El ciclo del agua y su vital importancia para la vida',
          summary: 'Una travesía pedagógica para comprender el viaje inagotable del recurso más preciado de nuestra isla y el planeta.',
          subject: 'Ciencias Naturales',
          grade: '5to Primaria',
          readTime: 8,
          status: 'published', // 'published', 'draft', 'scheduled'
          coverImage: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Esquema y paisaje del ciclo hidrológico en la naturaleza',
          author: 'Lic. Julio Cesar Mateo',
          role: 'Docente de Informática',
          views: 2450,
          createdAt: new Date('2025-03-14T08:30:00Z').getTime(),
          content: `
            <div style="background:linear-gradient(135deg,#ffedd5,#f0fdf4);padding:20px 24px;border-radius:12px;margin-bottom:24px;border-left:4px solid #c2410c;">
              <p style="margin:0 0 8px;font-weight:700;color:#9a3412;">📋 Ficha Curricular — Alineada al Currículo MINERD</p>
              <p style="margin:4px 0;"><strong>Competencia fundamental:</strong> Científica y Tecnológica</p>
              <p style="margin:4px 0;"><strong>Eje temático:</strong> La Tierra y el Universo — Ciclos naturales</p>
              <p style="margin:4px 0;"><strong>Indicador de logro:</strong> Describe las fases del ciclo del agua y explica su importancia para los ecosistemas locales.</p>
              <p style="margin:4px 0;"><strong>Grado:</strong> 5to Primaria &nbsp;|&nbsp; <strong>Duración:</strong> 3 sesiones de 45 min</p>
            </div>

            <h2>1. ¿De dónde viene la lluvia que riega nuestros campos?</h2>
            <p>Cada vez que observamos un aguacero vespertino sobre Santo Domingo, el verde valle del Cibao o las aguas cristalinas del río Yaque del Norte, estamos presenciando una obra maestra de la naturaleza que lleva miles de millones de años en marcha: <strong>el ciclo del agua</strong>.</p>
            <p>Para los estudiantes de primaria en nuestra región insular, comprender este ciclo no es solo una lección de ciencias; es entender la columna vertebral de nuestra agricultura, nuestro clima templado por los alisios y el agua potable que llega a nuestros hogares y aulas escolares.</p>

            <blockquote style="border-left:4px solid #c2410c;padding:16px 20px;background:#fff7ed;border-radius:0 8px 8px 0;margin:24px 0;">
              <p style="font-style:italic;margin:0 0 8px;">«El agua que bebió un dinosaurio hace millones de años es exactamente la misma molécula que hoy acaricia las hojas de nuestros manglares dominicanos.»</p>
              <cite style="color:#64748b;">— Principio de Conservación Hidrológica</cite>
            </blockquote>

            <h2>2. Las 4 fases clave del ciclo continuo</h2>
            <p>El agua se transforma de líquido a gas y de gas a sólido en una danza ininterrumpida:</p>
            <ol>
              <li><strong>Evaporación:</strong> El calor del sol calienta el agua superficial de los ríos, lagos y el inmenso mar Caribe, transformándola en vapor invisible que asciende a la atmósfera. En República Dominicana, con más de 1,600 km de costa, la evaporación es intensa todo el año.</li>
              <li><strong>Condensación:</strong> Al enfriarse en las capas altas, el vapor de agua se agrupa en diminutas gotas formando las nubes y la neblina matutina que cubre nuestras cordilleras Central y Septentrional.</li>
              <li><strong>Precipitación:</strong> Cuando las nubes se saturan, las gotas caen por gravedad en forma de lluvia, llovizna o, en el Pico Duarte, ocasionalmente granizo. Nuestro país recibe un promedio de 1,500 mm de lluvia al año.</li>
              <li><strong>Recolección (Escorrentía e Infiltración):</strong> El agua alimenta los acuíferos subterráneos, fluye por las cuencas de los 20 ríos principales y desemboca de vuelta en el océano, reiniciando el ciclo.</li>
            </ol>

            <div style="background:#ecfdf5;padding:16px 20px;border-radius:10px;margin:24px 0;border:1px solid #a7f3d0;">
              <h4 style="margin:0 0 8px;color:#065f46;">🌿 ¿Sabías que...?</h4>
              <p style="margin:0;">La Cordillera Central de la República Dominicana es conocida como la <em>«Madre de las Aguas»</em>. Allí nacen los ríos Yaque del Norte, Yaque del Sur, Artibonito y Yuna, que abastecen a más del 70% de la población dominicana.</p>
            </div>

            <h2>3. Secuencia Didáctica: El Experimento de la Bolsa Viajera</h2>
            <p>Esta actividad permite a los estudiantes <strong>observar las 4 fases del ciclo en tiempo real</strong> usando materiales de bajo costo disponibles en cualquier escuela dominicana.</p>

            <div style="background:#fff;padding:20px;border-radius:10px;border:1px solid #e2e8f0;margin:16px 0;">
              <h4 style="color:#92400e;margin-top:0;">🧪 Materiales (por equipo de 4 estudiantes)</h4>
              <ul>
                <li>1 bolsa plástica tipo ziploc transparente</li>
                <li>1 taza de agua</li>
                <li>Colorante azul alimentario (2 gotas)</li>
                <li>Cinta adhesiva fuerte</li>
                <li>1 marcador permanente</li>
              </ul>

              <h4 style="color:#92400e;">📝 Procedimiento (Sesión 1 — 45 min)</h4>
              <ol>
                <li>Verter el agua con colorante en la bolsa y sellarla herméticamente.</li>
                <li>Con el marcador, dibujar un sol arriba, nubes en el medio y el mar abajo.</li>
                <li>Pegar la bolsa en una ventana que reciba sol directo (orientación sur ideal).</li>
                <li>Registrar en el cuaderno: hora, temperatura del aula, estado de la bolsa.</li>
                <li><strong>Predicción:</strong> Cada equipo escribe qué cree que pasará en 2 horas.</li>
              </ol>

              <h4 style="color:#92400e;">🔍 Observación (Sesión 2 — día siguiente, 45 min)</h4>
              <ol>
                <li>Observar las gotas formadas en la parte superior de la bolsa (condensación).</li>
                <li>Dibujar en el cuaderno lo que ven y etiquetar cada fase.</li>
                <li>Comparar con la predicción: ¿acertaron? ¿Qué los sorprendió?</li>
                <li>Discusión guiada: ¿Qué pasaría si tapamos el sol? ¿Y si la bolsa estuviera abierta?</li>
              </ol>
            </div>

            <h2>4. Actividad para la Familia</h2>
            <div style="background:#fef3c7;padding:16px 20px;border-radius:10px;margin:16px 0;border:1px solid #fcd34d;">
              <p style="margin:0 0 12px;font-weight:700;color:#92400e;">🏠 Misión en Casa (con un adulto acompañante)</p>
              <ol style="margin:0;">
                <li>Recorrer la casa identificando dónde se <em>usa</em> agua y dónde se <em>desperdicia</em>.</li>
                <li>Llenar una tabla con 3 columnas: lugar, uso, cantidad estimada.</li>
                <li>Proponer 3 acciones concretas para ahorrar agua en su hogar.</li>
                <li>Opcional: Tomar una foto del grifo que más gotea y traerla al aula.</li>
              </ol>
            </div>

            <h2>5. Síntesis y Compromiso Ciudadano</h2>
            <p>El ciclo hidrológico no es estático; se ve directamente impactado por la deforestación de nuestras lomas, la contaminación por plásticos en cañadas y ríos, y el calentamiento global. Cada árbol que sembramos en nuestras escuelas es un regulador del ciclo; cada botella plástica que recogemos de un arroyo es una barrera menos para el flujo natural del agua.</p>

            <div style="background:linear-gradient(135deg,#ede9fe,#ffedd5);padding:20px;border-radius:10px;margin:24px 0;">
              <h4 style="margin:0 0 12px;color:#5b21b6;">📊 Rúbrica de Evaluación Formativa</h4>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                  <tr style="background:#8b5cf6;color:#fff;">
                    <th style="padding:8px;text-align:left;border-radius:6px 0 0 0;">Criterio</th>
                    <th style="padding:8px;text-align:center;">Avanzado (4)</th>
                    <th style="padding:8px;text-align:center;">Satisfactorio (3)</th>
                    <th style="padding:8px;text-align:center;border-radius:0 6px 0 0;">En proceso (2)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style="background:#fffbeb;">
                    <td style="padding:8px;font-weight:600;">Identifica las 4 fases</td>
                    <td style="padding:8px;text-align:center;">Nombra y explica las 4 con ejemplos locales</td>
                    <td style="padding:8px;text-align:center;">Nombra las 4 fases correctamente</td>
                    <td style="padding:8px;text-align:center;">Identifica 2-3 fases</td>
                  </tr>
                  <tr>
                    <td style="padding:8px;font-weight:600;">Experimento</td>
                    <td style="padding:8px;text-align:center;">Registra y explica relación causa-efecto</td>
                    <td style="padding:8px;text-align:center;">Realiza el experimento y registra</td>
                    <td style="padding:8px;text-align:center;">Realiza el experimento con ayuda</td>
                  </tr>
                  <tr style="background:#fffbeb;">
                    <td style="padding:8px;font-weight:600;">Compromiso ambiental</td>
                    <td style="padding:8px;text-align:center;">Propone y ejecuta acciones en su entorno</td>
                    <td style="padding:8px;text-align:center;">Propone acciones concretas</td>
                    <td style="padding:8px;text-align:center;">Reconoce la importancia del cuidado</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="background:#fff7ed;padding:16px 20px;border-radius:10px;margin:16px 0;border:1px solid #bae6fd;">
              <p style="margin:0;font-weight:600;color:#9a3412;">📖 Referencias Curriculares</p>
              <ul style="margin:8px 0 0;color:#334155;">
                <li>Diseño Curricular Nivel Primario, MINERD (2014), Área Ciencias de la Naturaleza.</li>
                <li>Ordenanza 02-2015, sobre el currículo revisado del Nivel Primario.</li>
                <li>UNESCO (2023). Educación para el Desarrollo Sostenible — ODS 6: Agua limpia.</li>
              </ul>
            </div>
          `,
          tags: ['Biodiversidad', 'MINERD', 'EducaciónAmbiental', 'Agua']
        },
        {
          id: 'art-fracciones-equiv',
          title: 'Comprendiendo las fracciones equivalentes: método visual para el aula y el hogar',
          summary: 'Estrategias gráficas paso a paso para desmitificar las fracciones y construir intuición matemática sólida.',
          subject: 'Matemáticas',
          grade: '6to Primaria',
          readTime: 7,
          status: 'published',
          coverImage: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Regletas y círculos fraccionarios manipulativos',
          author: 'Lic. Marcos Peña',
          role: 'Docente de Matemáticas',
          views: 1890,
          createdAt: new Date('2025-03-11T10:15:00Z').getTime(),
          content: `
            <h2>¿Por qué 1/2 es igual a 2/4 y a 4/8?</h2>
            <p>El concepto de equivalencia en fracciones suele ser una de las principales barreras pedagógicas cuando se aborda de forma puramente abstracta. Utilizando el método Singapur (Concreto-Pictórico-Abstracto), los niños pueden ver y tocar las divisiones antes de operar con números.</p>
            <p>Presentar un pastel circular dividido en 2 mitades frente a otro dividido en 4 cuartos permite comprender de inmediato que la cantidad de superficie ocupada es idéntica.</p>
          `,
          tags: ['Matemáticas', 'MétodoCPA', 'GeometríaLúdica']
        },
        {
          id: 'art-oraciones-claras',
          title: 'Cómo construir oraciones claras y coherentes en la escuela primaria',
          summary: 'Guía de sintaxis lúdica para niños: identificación del sujeto y predicado mediante fichas manipulables.',
          subject: 'Lengua Española',
          grade: '4to Primaria',
          readTime: 4,
          status: 'published',
          coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Cuaderno escolar con ejercicios caligráficos y gramaticales',
          author: 'Mtra. Altagracia Díaz',
          role: 'Docente de Letras',
          views: 940,
          createdAt: new Date('2025-03-08T12:00:00Z').getTime(),
          content: `
            <h2>El juego de los bloques sintácticos</h2>
            <p>Aprender la concordancia entre género y número es mucho más sencillo cuando los alumnos construyen oraciones como si fuesen trenes con vagones: ¿Quién realiza la acción? ¿Qué acción realiza? ¿Dónde o cómo ocurre?</p>
          `,
          tags: ['LenguaEspañola', 'RedacciónInicial', 'Gramática']
        },
        {
          id: 'art-manglares-borrador',
          title: 'Ecosistemas Costeros y Manglares de Samaná',
          summary: 'Una secuencia reflexiva y multidisciplinar diseñada para conectar a los alumnos de primaria con el patrimonio marino.',
          subject: 'Ciencias Naturales',
          grade: '5to Primaria',
          readTime: 6,
          status: 'draft',
          coverImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          coverAlt: 'Paisaje de manglar rojo costero',
          author: 'Lic. Julio Cesar Mateo',
          role: 'Docente de Informática',
          views: 0,
          createdAt: new Date('2025-03-15T09:00:00Z').getTime(),
          content: `
            <h2>Guardianes del litoral dominicano</h2>
            <p>Borrador en construcción. Pendiente de anexar la rúbrica formativa y las preguntas de observación de campo.</p>
          `,
          tags: ['Biodiversidad', 'Samaná', 'EducaciónAmbiental']
        }
      ];

      for (const art of defaultArticles) {
        await this._putRaw('articles', art);
      }

      // Sembrar comentarios
      const defaultComments = [
        {
          id: 'comm-1',
          articleId: 'art-ciclo-agua',
          authorName: 'Prof. Manuel Grullón',
          authorType: 'teacher', // teacher, family, student, guest
          authorBadge: 'Docente Verificado',
          schoolInfo: 'Escuela Rep. de Chile • Distrito 10-01',
          content: 'Excelente desglose. Realizamos hoy mismo el experimento de la bolsa con mis 28 alumnos de 5to grado y la emoción fue fantástica. ¿Tiene recomendaciones para adaptarlo con menos luz solar?',
          status: 'pending', // pending, approved, rejected, spam
          createdAt: new Date(Date.now() - 45 * 60 * 1000).getTime(),
          teacherReply: null
        },
        {
          id: 'comm-2',
          articleId: 'art-ciclo-agua',
          authorName: 'Estefanía Peña',
          authorType: 'family',
          authorBadge: 'Familia Comunidad',
          schoolInfo: 'Madre de estudiante de 5to A',
          content: 'Leí este recurso junto a mi hijo para su proyecto escolar de ciencias. Las preguntas finales nos sirvieron para debatir el consumo de agua en casa.',
          status: 'approved',
          createdAt: new Date(Date.now() - 24 * 3600 * 1000).getTime(),
          teacherReply: '¡Qué alegría inmensa, querida Estefanía! Ese asombro espontáneo en los ojos de los chicos es el corazón de la ciencia activa. ¡Un abrazo cálido a su grupo!'
        },
        {
          id: 'comm-3',
          articleId: 'art-fracciones-equiv',
          authorName: 'Visitante_982',
          authorType: 'guest',
          authorBadge: 'Anónimo',
          schoolInfo: 'IP: 179.53.*.* • Sin credenciales',
          content: 'Para resolver rápido sus tareas miren este link gratis en hxxp://descarga-examenes-rd.cc y ganen puntos sin estudiar.',
          status: 'pending', // flagged
          isSpamAlert: true,
          createdAt: new Date(Date.now() - 2 * 3600 * 1000).getTime(),
          teacherReply: null
        }
      ];

      for (const comm of defaultComments) {
        await this._putRaw('comments', comm);
      }

      // Sembrar biblioteca multimedia inicial
      const defaultMedia = [
        {
          id: 'media-esquema-ciclo',
          title: 'Esquema ciclo del agua RD',
          category: 'infografias',
          url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 420,
          dimensions: '1200x800',
          altText: 'Diagrama del ciclo del agua en la Cordillera Central y costas dominicanas',
          associatedArticle: 'El ciclo del agua y su importancia para la vida',
          createdAt: new Date('2024-10-14').getTime()
        },
        {
          id: 'media-manglares',
          title: 'Manglares costa norte Samaná',
          category: 'portadas',
          url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 310,
          dimensions: '1200x800',
          altText: 'Vista de manglares y estuario tropical',
          associatedArticle: 'Ecosistemas Costeros y Manglares de Samaná',
          createdAt: new Date('2024-10-20').getTime()
        },
        {
          id: 'media-fracciones',
          title: 'Material didáctico fracciones',
          category: 'fichas',
          url: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80',
          sizeKB: 280,
          dimensions: '1080x720',
          altText: 'Caja con regletas de madera fraccionarias',
          associatedArticle: 'Comprendiendo las fracciones equivalentes',
          createdAt: new Date('2024-11-02').getTime()
        }
      ];

      for (const med of defaultMedia) {
        await this._putRaw('media', med);
      }

      // Sembrar perfil docente por defecto (editable desde perfil.html)
      const settingsCount = await this._countRaw('settings');
      if (settingsCount === 0) {
        await this._putRaw('settings', {
          key: 'teacherProfile',
          name: 'Julio Cesar Mateo',
          title: 'Lic.',
          role: 'Docente de Informática',
          specialty: 'Informática • Bachiller Técnico, 4to grado',
          school: 'Politécnico José Núñez de Cáceres',
          yearsExperience: 0,
          bio: 'Licenciado en Informática. Enseño Informática en Bachiller Técnico y comparto aquí recursos, guías y experiencias para aprender tecnología de forma práctica.',
          photoUrl: 'data:image/jpeg;base64,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',
          updatedAt: Date.now()
        });
      }
    }
  }

  // ── Método faltante: actualizar artículo (usado por lectura.html para vistas) ──
  async updateArticle(id, updates) {
    const article = await this.get('articles', id);
    if (!article) return null;
    Object.assign(article, updates, { updatedAt: Date.now() });
    await this.put('articles', article);
    return article;
  }

  // Operaciones CRUD genéricas sobre IndexedDB
  async get(storeName, key) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async put(storeName, item) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(item);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, key) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(key);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async count(storeName) {
    await this._initPromise;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([storeName], 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  // Métodos específicos de Dominio Educativo (Facade)
  async getPublishedArticles() {
    const articles = await this.getAll('articles');
    return articles.filter(a => a.status === 'published').sort((a, b) => b.createdAt - a.createdAt);
  }

  async getArticleById(id) {
    return await this.get('articles', id);
  }

  async saveArticle(articleData) {
    if (!articleData.id) {
      articleData.id = 'art-' + Date.now();
      articleData.createdAt = Date.now();
      articleData.views = 0;
    }
    articleData.updatedAt = Date.now();
    await this.put('articles', articleData);
    return articleData;
  }

  async deleteArticle(id) {
    // Soft-delete: mover a papelera (status = 'trash') en vez de borrar permanentemente
    const article = await this.get('articles', id);
    if (!article) return false;
    article.previousStatus = article.status;
    article.status = 'trash';
    article.trashedAt = Date.now();
    await this.put('articles', article);
    return true;
  }

  async restoreArticle(id) {
    const article = await this.get('articles', id);
    if (!article || article.status !== 'trash') return null;
    article.status = article.previousStatus || 'draft';
    delete article.trashedAt;
    delete article.previousStatus;
    await this.put('articles', article);
    return article;
  }

  async permanentDeleteArticle(id) {
    // Eliminación permanente real (solo para vaciar papelera)
    const comments = await this.getAll('comments');
    for (const c of comments) {
      if (c.articleId === id) {
        await this.delete('comments', c.id);
      }
    }
    return await this.delete('articles', id);
  }

  async getTrashedArticles() {
    const articles = await this.getAll('articles');
    return articles.filter(a => a.status === 'trash').sort((a, b) => b.trashedAt - a.trashedAt);
  }

  async getCommentsByArticle(articleId, onlyApproved = true) {
    const all = await this.getAll('comments');
    return all.filter(c => c.articleId === articleId && (!onlyApproved || c.status === 'approved'))
              .sort((a, b) => b.createdAt - a.createdAt);
  }

  async addComment(commentData) {
    if (!commentData.id) {
      commentData.id = 'comm-' + Date.now();
      commentData.createdAt = Date.now();
      commentData.status = 'pending'; // moderación requerida por defecto
    }
    await this.put('comments', commentData);
    return commentData;
  }

  async updateCommentStatus(id, newStatus, replyText = null) {
    const comm = await this.get('comments', id);
    if (!comm) return null;
    comm.status = newStatus;
    if (replyText !== null) {
      comm.teacherReply = replyText;
    }
    await this.put('comments', comm);
    return comm;
  }

  async deleteComment(id) {
    return await this.delete('comments', id);
  }

  async getAllMedia() {
    const items = await this.getAll('media');
    return items.sort((a, b) => b.createdAt - a.createdAt);
  }

  async saveMedia(mediaData) {
    if (!mediaData.id) {
      mediaData.id = 'media-' + Date.now();
      mediaData.createdAt = Date.now();
    }
    await this.put('media', mediaData);
    return mediaData;
  }

  async deleteMedia(id) {
    return await this.delete('media', id);
  }

  // ── Perfil Docente ──
  async getTeacherProfile() {
    const profile = await this.get('settings', 'teacherProfile');
    // Retornar defaults si no existe
    return profile || {
      key: 'teacherProfile',
      name: 'Docente',
      title: '',
      role: '',
      specialty: '',
      school: '',
      yearsExperience: 0,
      bio: '',
      photoUrl: '',
      updatedAt: Date.now()
    };
  }

  async updateTeacherProfile(updates) {
    const current = await this.getTeacherProfile();
    Object.assign(current, updates, { key: 'teacherProfile', updatedAt: Date.now() });
    await this.put('settings', current);
    return current;
  }
}

// Instancia global exportable
window.AulaAbiertaDB = new StorageService();

// === XSS Sanitization Utilities ===

// Sanitize rich HTML content — strips scripts, iframes, event handlers, dangerous tags
// Use for article body content that legitimately contains formatting (h2, p, strong, etc.)
function sanitizeHTML(html) {
  if (!html) return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  // Remove dangerous tags
  div.querySelectorAll('script, iframe, object, embed, form, input').forEach(el => el.remove());
  // Remove event handlers and javascript: URLs
  div.querySelectorAll('*').forEach(el => {
    Array.from(el.attributes).forEach(attr => {
      if (attr.name.startsWith('on') || attr.value.startsWith('javascript:')) {
        el.removeAttribute(attr.name);
      }
    });
  });
  return div.innerHTML;
}
window.sanitizeHTML = sanitizeHTML;

// Escape plain text for safe insertion into HTML templates
// Use for author names, titles, summaries, comments — any user string in a template literal
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
window.escapeHTML = escapeHTML;

// === Non-blocking Toast Notification ===
window.showToast = function(message, type) {
  if (typeof type === 'string' && !['success','error','warning','info'].includes(type)) type = 'info';
  const toast = document.createElement('div');
  toast.className = 'toast-notification toast-' + (type || 'info');
  toast.textContent = message;
  toast.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:12px 24px;border-radius:8px;color:#fff;font-size:14px;z-index:9999;animation:fadeIn .3s ease;max-width:400px;box-shadow:0 4px 12px rgba(0,0,0,.15);';
  toast.style.backgroundColor = type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6';
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3000);
};
