# Plantillas de Correo para Supabase (Hollow Bits)

Estas plantillas han sido diseñadas con código HTML seguro para clientes de correo (Gmail, Outlook, Apple Mail) respetando el branding "Tech Brutalism" oscuro y premium de Hollow Bits.

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
    body { margin: 0; padding: 0; background-color: #06080a; color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
    .logo { width: 120px; margin-bottom: 30px; }
    .card { background-color: #0d1117; border: 1px solid #1a1f26; border-radius: 12px; padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.5); }
    .title { font-size: 24px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.5; color: #a1a1aa; margin-bottom: 30px; }
    .button { display: inline-block; background: linear-gradient(135deg, #FF3366 0%, #7C3AED 100%); color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; letter-spacing: 0.5px; }
    .footer { margin-top: 40px; font-size: 12px; color: #52525b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="title">Bienvenido a HOLLOW bits</h1>
      <p class="text">Has iniciado el proceso para unirte a nuestro ecosistema DAW. Confirma tu identidad para acceder a tu consola y comenzar a crear.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Verificar mi Cuenta</a>
    </div>
    <div class="footer">
      <p>Si no solicitaste esta cuenta, puedes ignorar este correo de forma segura.</p>
      <p>&copy; 2026 Hollow Bits. Studio Without Limits.</p>
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
    body { margin: 0; padding: 0; background-color: #06080a; color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
    .card { background-color: #0d1117; border: 1px solid #1a1f26; border-radius: 12px; padding: 40px; }
    .title { font-size: 24px; font-weight: 700; margin-bottom: 15px; letter-spacing: -0.5px; }
    .text { font-size: 16px; line-height: 1.5; color: #a1a1aa; margin-bottom: 30px; }
    .button { display: inline-block; background-color: #ffffff; color: #000000; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #52525b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="title">Recuperación de Acceso</h1>
      <p class="text">Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en la red de HOLLOW bits.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Restablecer Contraseña</a>
    </div>
    <div class="footer">
      <p>Este enlace expirará pronto. Si no solicitaste este cambio, no es necesario realizar ninguna acción.</p>
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
    body { margin: 0; padding: 0; background-color: #06080a; color: #ffffff; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; text-align: center; }
    .card { background-color: #0d1117; border: 1px solid #1a1f26; border-radius: 12px; padding: 40px; border-top: 4px solid #7C3AED; }
    .title { font-size: 24px; font-weight: 700; margin-bottom: 15px; }
    .text { font-size: 16px; line-height: 1.5; color: #a1a1aa; margin-bottom: 30px; }
    .button { display: inline-block; background-color: #7C3AED; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: bold; font-size: 16px; }
    .footer { margin-top: 40px; font-size: 12px; color: #52525b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <h1 class="title">Tu Acceso Seguro</h1>
      <p class="text">Utiliza el siguiente botón para iniciar sesión directamente en tu consola de forma segura, sin necesidad de contraseña.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Entrar a la Consola</a>
    </div>
    <div class="footer">
      <p>Este enlace mágico es de un solo uso y expirará pronto.</p>
    </div>
  </div>
</body>
</html>
```
