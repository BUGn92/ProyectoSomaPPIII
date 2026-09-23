import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

MAILTRAP_TOKEN = os.getenv("MAILTRAP_TOKEN", "")
MAILTRAP_SENDER_EMAIL = os.getenv("MAILTRAP_SENDER_EMAIL", "hello@demomailtrap.co")
MAILTRAP_SENDER_NAME = os.getenv("MAILTRAP_SENDER_NAME", "SOMA Gym")

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", "soporte@somagym.com")

def send_otp_email(to_email: str, otp_code: str, user_name: str) -> bool:
    """
    Envía un código OTP de 6 dígitos por correo electrónico utilizando Mailtrap SDK (o SMTP como alternativa).
    Si no está configurado o falla, realiza un log/print de desarrollo como fallback.
    """
    subject = "SOMA Gym - Código de Verificación para Recuperación de Contraseña"
    
    text_content = f"""Hola {user_name},

Has solicitado restablecer tu contraseña en SOMA Gym.
Tu código de verificación OTP es: {otp_code}

Este código vence en 15 minutos. Si no solicitaste este cambio, ignora este mensaje.

Atentamente,
Equipo de SOMA Gym
"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f7; margin: 0; padding: 20px;">
      <div style="max-width: 500px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <h2 style="color: #ff3b30; text-align: center; margin-top: 0;">SOMA Gym</h2>
        <h3 style="color: #333333; text-align: center;">Código de Verificación</h3>
        <p style="color: #555555; font-size: 15px; line-height: 1.5;">Hola <strong>{user_name}</strong>,</p>
        <p style="color: #555555; font-size: 15px; line-height: 1.5;">Has solicitado restablecer tu contraseña. Utilizá el siguiente código de 6 dígitos para verificar tu identidad:</p>
        
        <div style="background-color: #f8f9fa; border: 2px dashed #ff3b30; padding: 18px; text-align: center; border-radius: 10px; margin: 25px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ff3b30;">{otp_code}</span>
        </div>
        
        <p style="color: #888888; font-size: 13px; text-align: center;">⏱️ Este código vence en <strong>15 minutos</strong>.<br>Si no solicitaste este cambio, podés ignorar este correo.</p>
        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 25px 0;">
        <p style="color: #aaaaaa; font-size: 12px; text-align: center;">SOMA Gym &bull; Sistema de Gestión Integral</p>
      </div>
    </body>
    </html>
    """

    # 1. Intentar envío con Mailtrap SDK (Email API)
    if MAILTRAP_TOKEN:
        try:
            import mailtrap as mt
            client = mt.MailtrapClient(token=MAILTRAP_TOKEN)
            mail = mt.Mail(
                sender=mt.Address(email=MAILTRAP_SENDER_EMAIL, name=MAILTRAP_SENDER_NAME),
                to=[mt.Address(email=to_email, name=user_name)],
                subject=subject,
                text=text_content,
                html=html_content,
                category="Password Recovery OTP"
            )
            response = client.send(mail)
            logger.info(f"Correo OTP enviado con Mailtrap SDK: {response}")
            print(f"📧 [MAILTRAP SDK SUCCESS] Correo OTP enviado a {to_email}: {response}")
            return True
        except Exception as e:
            logger.error(f"Error al enviar correo vía Mailtrap SDK: {e}")
            print(f"⚠️ [MAILTRAP SDK FAIL] Falló el envío con Mailtrap SDK ({e}). Probando alternativa SMTP...")

    # 2. Intentar envío real SMTP si está configurado
    if SMTP_HOST and SMTP_USER:
        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = SMTP_FROM
            msg["To"] = to_email

            msg.attach(MIMEText(text_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
            
            logger.info(f"Correo OTP enviado exitosamente a {to_email}")
            print(f"📧 [SMTP SUCCESS] Correo OTP enviado a {to_email}")
            return True
        except Exception as e:
            logger.error(f"Error al enviar correo SMTP a {to_email}: {e}")
            print(f"⚠️ [SMTP FAIL] No se pudo enviar por SMTP ({e}). Fallback activado:")

    # Fallback de desarrollo
    print(f"============================================================")
    print(f"🔑 [EMAIL OTP DEV FALLBACK]")
    print(f"   Destinatario : {to_email} ({user_name})")
    print(f"   Código OTP   : {otp_code}")
    print(f"   Expiración   : 15 minutos")
    print(f"============================================================")
    return True

def mask_email(email: str) -> str:
    """Enmascara un email para proteger la privacidad en las respuestas. Ej: agustin@gmail.com -> a***n@gmail.com"""
    if not email or "@" not in email:
        return email
    parts = email.split("@")
    user_part, domain = parts[0], parts[1]
    if len(user_part) <= 2:
        masked_user = user_part[0] + "*"
    else:
        masked_user = user_part[0] + "*" * (len(user_part) - 2) + user_part[-1]
    return f"{masked_user}@{domain}"
