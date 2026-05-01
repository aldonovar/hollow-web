# Nuevas Plantillas de Correo Brutalistas (Hollow Bits)

A continuación tienes el nuevo diseño "Tech Brutalism" 100% puro: esquinas cuadradas, máximo contraste (blanco sobre negro puro), fuente monoespaciada o serif sólida, sin gradientes, asegurando legibilidad total incluso en bandejas de SPAM.

**Instrucciones de Instalación:**
1. Ve a **Supabase Dashboard -> Authentication -> Email Templates**.
2. Copia y pega el código correspondiente en la pestaña "Source" (o Código HTML) de cada sección.

---

## 1. Confirm Signup (Confirmación de Registro)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: 'Courier New', Courier, monospace; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: left; }
    .card { background-color: #000000; border: 2px solid #ffffff; border-radius: 0; padding: 40px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
    .text { font-size: 16px; line-height: 1.6; color: #cccccc; margin-bottom: 30px; }
    .button { display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 16px 32px; font-weight: bold; font-size: 16px; border-radius: 0; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; border: 2px solid #ffffff; }
    .footer { margin-top: 40px; font-size: 12px; color: #666666; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="title">HOLLOW BITS<br>VERIFICACIÓN</h1>
      <p class="text">ACCESO REQUERIDO. CONFIRMA TU IDENTIDAD PARA ENTRAR A LA CONSOLA DEL SISTEMA Y ACTIVAR TU CUENTA DAW.</p>
      <a href="{{ .ConfirmationURL }}" class="button">VERIFICAR CUENTA</a>
    </div>
    <div class="footer">
      <p>SISTEMA CENTRAL HOLLOW BITS &copy; 2026</p>
    </div>
  </div>
</body>
</html>
```

---

## 2. Reset Password (Recuperación de Contraseña)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: 'Courier New', Courier, monospace; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: left; }
    .card { background-color: #000000; border: 2px solid #ffffff; border-radius: 0; padding: 40px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
    .text { font-size: 16px; line-height: 1.6; color: #cccccc; margin-bottom: 30px; }
    .button { display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 16px 32px; font-weight: bold; font-size: 16px; border-radius: 0; text-transform: uppercase; letter-spacing: 1px; border: 2px solid #ffffff; }
    .footer { margin-top: 40px; font-size: 12px; color: #666666; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="title">RECUPERACIÓN<br>DE CLAVE</h1>
      <p class="text">SE HA SOLICITADO UN REINICIO DE CREDENCIALES PARA ESTE NODO. INGRESA AL ENLACE PARA ASIGNAR UNA NUEVA CONTRASEÑA.</p>
      <a href="{{ .ConfirmationURL }}" class="button">REINICIAR CLAVE</a>
    </div>
    <div class="footer">
      <p>ENLACE VÁLIDO POR TIEMPO LIMITADO.</p>
    </div>
  </div>
</body>
</html>
```

---

## 3. Magic Link (Acceso Directo)

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background-color: #000000; color: #ffffff; font-family: 'Courier New', Courier, monospace; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: left; }
    .card { background-color: #000000; border: 2px solid #ffffff; border-radius: 0; padding: 40px; }
    .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
    .text { font-size: 16px; line-height: 1.6; color: #cccccc; margin-bottom: 30px; }
    .button { display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 16px 32px; font-weight: bold; font-size: 16px; border-radius: 0; text-transform: uppercase; letter-spacing: 1px; border: 2px solid #ffffff; }
    .footer { margin-top: 40px; font-size: 12px; color: #666666; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="title">ENLACE<br>MÁGICO</h1>
      <p class="text">AUTORIZACIÓN DIRECTA. HAZ CLIC ABAJO PARA ENTRAR AL SISTEMA SIN REQUERIR CONTRASEÑA.</p>
      <a href="{{ .ConfirmationURL }}" class="button">ENTRAR AL SISTEMA</a>
    </div>
    <div class="footer">
      <p>ESTE ENLACE ES DE UN SOLO USO.</p>
    </div>
  </div>
</body>
</html>
```
