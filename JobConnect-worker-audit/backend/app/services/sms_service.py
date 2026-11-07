import requests
from requests.auth import HTTPBasicAuth

from app.config import settings
from app.repositories.user_repository import FirestoreUserRepository


class SMSService:
    def __init__(self) -> None:
        self.user_repo = FirestoreUserRepository()

    def _format_phone_number(self, phone: str) -> str:
        """
        Convert South African phone numbers to international format.

        Example:
        0639241328 -> +27639241328
        +27639241328 -> +27639241328
        """
        phone = phone.strip().replace(" ", "").replace("-", "")

        if phone.startswith("0"):
            phone = "+27" + phone[1:]

        elif phone.startswith("27"):
            phone = "+" + phone

        return phone

    def send_notification_sms(
        self,
        recipient_id: str,
        title: str,
        message: str,
    ) -> bool:
        """
        Send an SMS notification to the user's registered phone number.
        """

        # Get recipient from Firebase
        result = self.user_repo.get_by_id(recipient_id)

        if not result:
            print(f"SMS skipped: user {recipient_id} not found")
            return False

        _, user_data = result

        phone = user_data.get("phone")

        if not phone:
            print(
                f"SMS skipped: user {recipient_id} "
                "has no phone number"
            )
            return False

        # Check SMSPortal configuration
        if not (
            settings.smsportal_client_id
            and settings.smsportal_api_secret
            and settings.smsportal_url
        ):
            print("SMS skipped: SMSPortal is not configured")
            return False

        # Convert phone number to international format
        phone = self._format_phone_number(phone)

        print(f"SMS recipient: {phone}")

        sms_body = f"{title}\n\n{message}"

        payload = {
            "messages": [
                {
                    "content": sms_body,
                    "destination": phone,
                }
            ]
        }

        try:
            response = requests.post(
                settings.smsportal_url,
                auth=HTTPBasicAuth(
                    settings.smsportal_client_id,
                    settings.smsportal_api_secret,
                ),
                json=payload,
                timeout=30,
            )

            if response.status_code == 200:
                print(
                    f"SMS sent successfully to {phone}"
                )
                print(f"SMSPortal response: {response.json()}")
                return True

            print(
                f"SMS sending failed. "
                f"Status: {response.status_code}"
            )
            print(f"SMSPortal response: {response.text}")

            return False

        except requests.RequestException as exc:
            print(f"SMS sending failed: {exc}")
            return False