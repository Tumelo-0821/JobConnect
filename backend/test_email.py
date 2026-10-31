from app.services.otp_delivery_service import (
    OTPDeliveryService,
    OTPDeliveryError,
)

recipient = input("Enter your email address to receive the test message: ").strip()

if not recipient or "@" not in recipient:
    print("Please enter a valid email address.")
else:
    try:
        OTPDeliveryService().send_email(recipient, "123456")
        print("Email accepted by the SMTP server.")
        print("Check your inbox and spam folder.")
    except OTPDeliveryError as exc:
        print("Email delivery failed:", exc)