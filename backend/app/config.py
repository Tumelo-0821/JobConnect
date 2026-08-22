from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    app_env: str = "development"
    app_name: str = "JobConnect API"
    cors_origins: str = "http://localhost:3000"

    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440

    firebase_credentials_path: str = "/etc/secrets/firebase-service-account.json"
    firebase_credentials_json: str = ""

    firestore_users_collection: str = "users"
    firestore_jobs_collection: str = "jobs"
    firestore_applications_collection: str = "applications"

    @property
    def cors_origin_list(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins.split(",")
            if origin.strip()
        ]


settings = Settings()