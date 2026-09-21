from datetime import datetime

from pydantic import BaseModel, Field


class ConversationResponse(BaseModel):
    id: str
    employer_id: str
    worker_id: str
    created_at: datetime
    updated_at: datetime


class MessageCreate(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class MessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    message: str
    is_read: bool
    created_at: datetime


class ConversationWithMessagesResponse(BaseModel):
    conversation: ConversationResponse
    messages: list[MessageResponse]