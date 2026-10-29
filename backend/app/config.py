from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_env: str = "development"
    app_name: str = "JobConnect API"
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:8000"

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    firebase_credentials_path: str = "./firebase-service-account.json"
    firebase_credentials_json: str = ""
    firebase_storage_bucket: str = ""

    firestore_users_collection: str = "users"
    firestore_jobs_collection: str = "jobs"
    firestore_applications_collection: str = "applications"
    firestore_registration_otps_collection: str = "registration_otps"

    # Email OTP settings
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    email_from: str = ""
    smtp_use_tls: bool = True

    # Twilio SMS settings
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_phone_number: str = ""

    smsportal_client_id: str = ""
    smsportal_api_secret: str = ""
    smsportal_url: str = "https://rest.smsportal.com/bulkmessages"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()