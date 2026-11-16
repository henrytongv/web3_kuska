# Web3 Kuska
Aplicación Web para aprender a utilizar Web3 con fines educativos

## Módulos principales
- Pantalla del administrador
- Pantalla del usuario
- Servicios del backend

## Servicios del backend
Estos servicios deben ser expuestos como servicios para ser usados por el frontend

- Crear cuenta nueva ECDSA en Hedera y asignarle 3 HBARs. Debe devolver en la respuesta el número de cuenta, el DER Encoded Private Key y el DER Encoded Public Key
- Verificar cuenta nueva. Este servicio utiliza el Hedera Mirror Node para consultar si la cuenta pedida ya existe y además tiene un saldo de al menos 3 HBARs
- Crear nuevo tópico HCS en Hedera. "Público" significa que cualquiera puede leerlo a través del Mirror Node. El tópico se crea con `submitKey` igual a la llave del operador (OPERATOR_KEY), para que solamente el backend pueda escribir, y sin `adminKey`, para que nadie pueda borrar ni modificar el tópico. Los mensajes HCS son inmutables por naturaleza
- Escribir mensaje en tópico HCS de Hedera. La transacción `TopicMessageSubmitTransaction` se arma con la cuenta del usuario como pagador (transaction id generado con el account id del usuario) y se firma con la llave privada del usuario y además con la llave del operador (submitKey). De esta forma el Mirror Node registra al usuario como generador del mensaje (`payer_account_id`) y nadie fuera de la aplicación puede escribir en el tópico
- Tamaño máximo de cada mensaje: 1024 bytes (límite de un mensaje HCS en un solo bloque, sin fragmentación). El frontend y el backend deben validar este límite

Endpoints:

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| POST | /api/account | Recibe la contraseña NEW_ACCOUNT_PASSWORD, crea la cuenta y devuelve account id, llave privada y llave pública (DER) | Contraseña NEW_ACCOUNT_PASSWORD |
| GET | /api/account/:id/verify | Consulta el Mirror Node y responde si la cuenta existe y tiene al menos 3 HBARs | Ninguna |
| POST | /api/admin/login | Valida ADMIN_SCREEN_PASSWORD y crea la sesión del administrador | Contraseña ADMIN_SCREEN_PASSWORD |
| POST | /api/admin/logout | Cierra la sesión del administrador | Sesión de administrador |
| POST | /api/admin/topic | Crea un nuevo tópico HCS, lo guarda en la base de datos y lo marca como tópico actual | Sesión de administrador |
| GET | /api/topic/current | Entrega el tópico actual (o vacío si no hay) | Ninguna |
| GET | /api/topic/messages | Lee los últimos 30 mensajes del tópico actual. Siempre que sea posible, el cliente debe leer esta información directamente del Hedera public mirror node | Ninguna |
| POST | /api/topic/messages | Recibe account id, llave privada y texto del mensaje, y lo escribe en el tópico actual | Ninguna (requiere llave válida del usuario) |

Sesión del administrador: luego del login se crea una cookie `httpOnly`, `secure` (en producción) y `sameSite=strict`, firmada con la variable SESSION_SECRET del archivo .env, con expiración de 8 horas. La pantalla del administrador debe tener un botón "Cerrar sesión"

## Lectura de mensajes desde el Mirror Node
- URL: `https://testnet.mirrornode.hedera.com/api/v1/topics/{topicId}/messages?order=desc&limit=30` (luego se invierte el orden en el cliente para mostrarlo ascendente)
- Columnas de la grilla:
  - id de mensaje = `sequence_number`
  - fecha y hora = `consensus_timestamp`, convertida a la hora local del navegador
  - account id del generador = `payer_account_id`
  - mensaje = `message`, que llega codificado en base64 y debe decodificarse como UTF-8

## Base de datos
- La conexión se toma de la variable NEON_DB del archivo .env
- Las tablas se crean automáticamente al iniciar la aplicación si no existen
- Tabla `topics`:
  - `id` serial, llave primaria
  - `topic_id` text, código del tópico en Hedera (ej. 0.0.12345)
  - `created_at` timestamptz, fecha de creación
  - `is_current` boolean, indica si es el tópico actual
  - Índice único parcial sobre `is_current` donde `is_current = true`, para garantizar que solamente exista un tópico actual
  - Al crear un tópico nuevo, en una misma transacción se marca el anterior con `is_current = false` y el nuevo con `is_current = true`

## Pantalla del administrador
Solamente se puede acceder a través de la ruta "/admin"
Para poder entrar pide contraseña
Una vez dentro, la pantalla debe mostrar el código de tópico Hedera actual si hubiera

El menú de opciones del administrador es:

- Crear tópico: En esta pantalla se crea un tópico HCS de Hedera y se guarda en base de datos Neon ese tópico para que de ahora en adelante cada vez que un usuario mande un mensaje en la pantalla de chat, dicho mensaje se inserte en ese tópico, que será considerado el "tópico actual". En la tabla de tópicos no borrar el tópico anterior, simplemente acumularlos y agregar una columna que indique cuál es el tópico actual, para guardar el historial de tópicos pasados
- Mostrar chat: Muestra los últimos 30 mensajes del tópico. Debe mostrarlo en una grilla con las columnas: id de mensaje, fecha y hora en que se registró, account id del generador del mensaje y el mensaje como tal. Ordenado por fecha y hora ascendente, es decir, como si fuera una pantalla de chat donde el último mensaje siempre aparece abajo. Esta página además vuelve a pedir la información cada 4 segundos. Debe incluir un botón que al apretarlo abre una pestaña nueva donde invoca directamente al mirror node de Hedera para pedir la información de los últimos mensajes del tópico. Eso simplemente para comprobar que al mirarlo directamente a través del mirror node también se puede ver la información.
- La pantalla de chat debe tener además una caja de verificación, seleccionada por defecto, que hace que solamente se muestren los tres primeros caracteres de cada mensaje grabado en el tópico. El usuario debe estar en la capacidad de desmarcarla si desea. La razón para tener este filtro es porque este software es para uso demostrativo y esta pantalla será mostrada en vivo durante una clase de cómo usar Web3, por lo tanto para proteger la privacidad de los mensajes y al mismo tiempo demostrar que los tópicos de Hedera funcionan, se deben ver los mensajes cortados.
- Cerrar sesión: termina la sesión del administrador y vuelve a la pantalla de contraseña

## Pantalla del usuario

Esta es la ruta por defecto de la aplicación, la que intenta entrar cuando no se especifica ninguna ruta.

Al iniciar este módulo, debe detectar si el usuario ya ha entrado antes o no a la aplicación, para eso debe verificar si existe en el navegador del usuario un valor a través de localStorage de navegador, que tenga un account id de Hedera. Si existe entonces simplemente mostrar el menú principal.
Si no existe localStorage o sesión anterior, notifica al usuario que se va a crear su nueva cuenta en Hedera y que esto va a tomar unos momentos y que presione el botón continuar cuando esté listo. Aquí la pantalla debe pedir una contraseña que el backend debe verificar, dicha contraseña está especificada en la variable NEW_ACCOUNT_PASSWORD en el archivo .env. Si la contraseña es incorrecta, mostrar un mensaje de error y permitir volver a intentarlo. El proceso invoca el servicio para crear cuentas en Hedera e inmediatamente devuelve la información pero en el lado del cliente debe empezar una animación de reloj o de espera y empezar una verificación interna llamando detrás de cámaras al servicio de verificación de cuenta cada 3 segundos hasta que el servicio confirme que la cuenta existe y tiene el saldo mínimo requerido. Luego de eso recién mostrar al cliente que la cuenta ha sido correctamente creada y mostrar el número de cuenta en letras grandes y guardar en localStorage del navegador el account id, y las llaves pública y privada del usuario y usarlas de allí en adelante para cualquier operación que sea necesaria. Intentar en un intervalo de 3 s durante 7 minutos como máximo y en caso de nunca tener éxito mostrar un mensaje de que hubo un problema en la creación de la cuenta.

Una vez que el usuario ya tenga su cuenta confirmada, mostrar la página principal con el número de cuenta y las siguientes opciones:

- Ver número de cuenta en Hashscan (esto abre una ventana nueva del navegador en `https://hashscan.io/testnet/account/{accountId}`, donde se puede ver la información de la cuenta directamente en el explorador de la blockchain)
- Chatear: Si no hay tópico definido no mostrar nada, solamente un mensaje indicando que el tópico todavía no ha sido configurado por el administrador. Y si el tópico existe pero tiene cero mensajes mostrar la pantalla pero con cero mensajes. Esta opción abre la pantalla definida como "Mostrar chat" en el módulo administrador; pero, con la diferencia de que no tiene el filtro de solamente tres caracteres y tiene una caja de texto en la parte inferior en donde si la persona escribe un texto y aprieta el botón enviar, se manda a escribir al tópico actual. Si el envío falla, mostrar un mensaje de error y conservar el texto escrito para poder reintentar. Mostrar un contador de caracteres o bytes restantes según el límite de 1024 bytes
- Mostrar llaves: esta opción muestra el contenido del localStorage al usuario para que pueda copiarlo en otro lugar si es necesario. Esta pantalla debe tener un anuncio con letras grandes y en colores resaltados que diga que esta información es privada y nunca debe compartirla con nadie

## Características multi idioma
- La aplicación debe guardar en un archivo de texto, fuera del código fuente, todo mensaje que aparece en pantalla, para que luego sea fácil de traducir a otro idioma. Usar el módulo `@nuxtjs/i18n` con el archivo `i18n/locales/es.json`
- El idioma por defecto de la aplicación es el español

## Características técnicas
- Aplicación fullstack javascript utilizando Nuxt y Vue en sus versiones actuales. El backend se implementa con las rutas de servidor de Nuxt (`server/api`)
- La aplicación será instalada en el servicio de alojamiento de aplicaciones Railway, usando el plan Hobby. En Railway las variables de entorno no se leen del archivo .env, sino que se configuran en el panel de variables del servicio
- La aplicación puede crear las tablas que necesite para guardar su propia información, en la base de datos Neon DB SQL https://neon.com
- La aplicación puede conectarse con la red testnet Hedera a través de la librería javascript SDK de Hedera https://docs.hedera.com/native/quickstart/javascript
- La aplicación debe tener diseño responsive y debe funcionar en dispositivos móviles como celulares, tabletas y también en computadores de escritorio

## Características de seguridad
- Generar un archivo .gitignore adecuado para un proyecto de este tipo, que incluya como mínimo `.env`, `node_modules`, `.nuxt`, `.output` y archivos de logs
- Colocar en todas las páginas de la aplicación (incluida la del administrador) un banner o marquesina fijo que nunca se mueva en letras pequeñas pero con colores llamativos fuertes el siguiente texto: "Esta web es exclusivamente de uso educativo e informativo. Contiene datos de prueba en ambiente Testnet. No tiene ningún valor comercial ni real"
- Si el usuario limpia la memoria de su navegador pierde su acceso y debe empezar de cero. Para una web de pruebas como esta eso es aceptable
- Cualquier información confidencial será guardada en el archivo .env
- Esta aplicación es para uso educativo solamente
- Esta aplicación solamente es para uso demostrativo de la tecnología Hedera y solamente en ambiente de prueba Testnet
- Las variables para conexión a Hedera están en el archivo .env en OPERATOR_ID y OPERATOR_KEY (DER Encoded Private Key)
- La pantalla del administrador está protegida por una contraseña especificada en el archivo .env, variable ADMIN_SCREEN_PASSWORD
- La creación de cuentas nuevas está protegida por una contraseña especificada en el archivo .env, variable NEW_ACCOUNT_PASSWORD
- La sesión del administrador se firma con el valor de la variable SESSION_SECRET del archivo .env (cadena aleatoria de al menos 32 caracteres)
- La base de datos es Neon DB y su acceso está en el archivo .env, variable NEON_DB
- Guardar toda la información en el navegador del cliente que sea necesaria para luego firmar la transacción de enviar mensaje al HCS u otra con Hedera. En esencia esta sería una aplicación parecida a una billetera Web3 demostrativa y como esta es una aplicación demostrativa, esa información puede viajar al servidor de vuelta para que el backend firme las operaciones de interacción con la blockchain
- Nunca registrar en los logs del servidor el contenido de las peticiones que incluyan llaves privadas o contraseñas

## Documentación
- Genera un archivo readme.md con instrucciones de lo que se necesita para ejecutar el proyecto en modo local y para desplegarlo en Railway
