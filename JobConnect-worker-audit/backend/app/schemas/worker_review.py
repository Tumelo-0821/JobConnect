
from pydantic import BaseModel, Field, ConfigDict


class WorkerReviewCreate(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    rating: int = Field(ge=1, le=5)
    review: str | None = Field(default=None, max_length=1000)
