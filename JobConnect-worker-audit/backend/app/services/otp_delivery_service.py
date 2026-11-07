
import smtplib
from email.message import EmailMessage

import requests
from requests.auth import HTTPBasicAuth

from app.config import settings


class OTPDeliveryError(Exception):
    """Raised when an OTP cannot be delivered."""


class OTPDeliveryService:
    """Deliver OTPs through configured email or SMS providers."""

    def send_email(self, recipient: str, otp: str) -> None:
        if not all(
            [
                settings.smtp_host,
                settings.smtp_username,
                settings.smtp_password,
                settings.email_from,
            ]
        ):
            raise OTPDeliveryError(
                "Email OTP is not configured yet. Please choose SMS or try later."
            )

        message = EmailMessage()
        message["Subject"] = "Your JobConnect verification code"
        message["From"] = settings.email_from
        message["To"] = recipient
        message.set_content(
            f"Your JobConnect verification code is {otp}.\n\n"
            "This code expires in 10 minutes. "
            "If you did not request it, you can ignore this email."
        )

        try:
            with smtplib.SMTP(
                settings.smtp_host,
                settings.smtp_port,
                timeout=15,
            ) as server:
                if settings.smtp_use_tls:
                    server.starttls()

                server.login(
                    settings.smtp_username,
                    settings.smtp_password,
                )
                server.send_message(message)
        except (OSError, smtplib.SMTPException) as exc:
            raise OTPDeliveryError(
                "We couldn't send the verification email. Please try again later."
            ) from exc

    def send_sms(self, recipient: str, otp: str) -> None:
        if not all(
            [
                settings.smsportal_client_id,
                settings.smsportal_api_secret,
                settings.smsportal_url,
            ]
        ):
            raise OTPDeliveryError(
                "SMS OTP is not configured yet. Please choose email or try later."
            )

        phone = self._format_phone_number(recipient)
        message = (
            f"Your JobConnect verification code is {otp}. "
            "It expires in 10 minutes."
        )

        try:
            response = requests.post(
                settings.smsportal_url,
                auth=HTTPBasicAuth(
                    settings.smsportal_client_id,
                    settings.smsportal_api_secret,
                ),
                json={
                    "messages": [
                        {
                            "content": message,
                            "destination": phone,
                        }
                    ]
                },
                timeout=15,
            )
        except requests.RequestException as exc:
            raise OTPDeliveryError(
                "We couldn't send the SMS. Please try again later."
            ) from exc

        if response.status_code not in (200, 201, 202):
            raise OTPDeliveryError(
                "The SMS provider rejected the message. Please try again later."
            )

        # A successful HTTP response confirms provider acceptance, not
        # necessarily final delivery to the recipient.

    @staticmethod
    def _format_phone_number(phone: str) -> str:
        phone = phone.strip().replace(" ", "").replace("-", "")

        if phone.startswith("0"):
            phone = "+27" + phone[1:]
        elif phone.startswith("27"):
            phone = "+" + phone

        if not phone.startswith("+") or not phone[1:].isdigit():
            raise OTPDeliveryError(
                "Enter a valid phone number with a country code."
            )

        return phone
