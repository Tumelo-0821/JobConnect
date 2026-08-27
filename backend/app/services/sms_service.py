from twilio.rest import Client

from app.config import settings
from app.repositories.user_repository import FirestoreUserRepository


class SMSService:
    def __init__(self) -> None:
        self.user_repo = FirestoreUserRepository()

    def normalize_phone_number(self, phone: str) -> str:
        """
        Convert a South African phone number to E.164 format.

        Examples:
            0639241328 -> +27639241328
            639241328  -> +27639241328
            +27639241328 -> +27639241328
        """

        phone = phone.strip().replace(" ", "").replace("-", "")

        # Already international
        if phone.startswith("+"):
            return phone

        # South African number beginning with 0
        if phone.startswith("0"):
            return "+27" + phone[1:]

        # South African number without the leading 0
        if phone.startswith("27"):
            return "+" + phone

        # If we cannot identify the country format,
        # return the original value.
        return phone

    def send_notification_sms(
        self,
        recipient_id: str,
        title: str,
        message: str,
    ) -> bool:
        """
        Send an SMS notification to the user's registered phone number.

        Returns True if the SMS was sent successfully.
        Returns False if the user has no phone number or SMS sending fails.
        """

        # Get recipient from Firestore
        result = self.user_repo.get_by_id(recipient_id)

        if not result:
            print(f"SMS skipped: user {recipient_id} not found")
            return False

        _, user_data = result

        phone = user_data.get("phone")

        if not phone:
            print(
                f"SMS skipped: user {recipient_id} has no phone number"
            )
            return False

        # Convert database number to international format
        phone = self.normalize_phone_number(phone)

        print(f"SMS recipient: {phone}")

        if not (
            settings.twilio_account_sid
            and settings.twilio_auth_token
            and settings.twilio_phone_number
        ):
            print("SMS skipped: Twilio is not configured")
            return False

        try:
            client = Client(
                settings.twilio_account_sid,
                settings.twilio_auth_token,
            )

            sms_body = f"{title}\n\n{message}"

            result = client.messages.create(
                body=sms_body,
                from_=settings.twilio_phone_number,
                to=phone,
            )

            print(
                f"SMS sent successfully to {phone}. "
                f"Message SID: {result.sid}"
            )

            return True

        except Exception as exc:
            print(f"SMS sending failed: {exc}")
            return False