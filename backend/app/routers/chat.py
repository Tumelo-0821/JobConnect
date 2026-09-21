from fastapi import APIRouter, Depends, status

from app.dependencies import (
    get_chat_repository,
    get_current_user,
    get_user_repository,
)
from app.repositories.memory import ChatRepository, UserRepository
from app.schemas.chat import (
    ConversationResponse,
    MessageCreate,
    MessageResponse,
)
from app.services.chat_service import ChatService


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


def get_chat_service(
    chat_repo: ChatRepository = Depends(get_chat_repository),
    user_repo: UserRepository = Depends(get_user_repository),
) -> ChatService:
    return ChatService(
        chat_repo=chat_repo,
        user_repo=user_repo,
    )


# ---------------------------------------------------------
# CONVERSATIONS
# ---------------------------------------------------------


@router.get(
    "/conversations",
    response_model=list[ConversationResponse],
    summary="List my conversations",
)
def list_conversations(
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> list[ConversationResponse]:

    return chat_service.list_conversations(
        current_user
    )


@router.post(
    "/conversations/{user_id}",
    response_model=ConversationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Get or create a conversation",
)
def get_or_create_conversation(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> ConversationResponse:

    return chat_service.get_or_create_conversation(
        current_user=current_user,
        other_user_id=user_id,
    )


@router.get(
    "/conversations/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get a conversation",
)
def get_conversation(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> ConversationResponse:

    return chat_service.get_conversation(
        current_user=current_user,
        conversation_id=conversation_id,
    )


# ---------------------------------------------------------
# MESSAGES
# ---------------------------------------------------------


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
    summary="Get conversation messages",
)
def list_messages(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> list[MessageResponse]:

    return chat_service.list_messages(
        current_user=current_user,
        conversation_id=conversation_id,
    )


@router.post(
    "/conversations/{conversation_id}/messages",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Send a message",
)
def send_message(
    conversation_id: str,
    payload: MessageCreate,
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> MessageResponse:

    return chat_service.send_message(
        current_user=current_user,
        conversation_id=conversation_id,
        message=payload.message,
    )


# ---------------------------------------------------------
# READ STATUS
# ---------------------------------------------------------


@router.patch(
    "/messages/{message_id}/read",
    response_model=MessageResponse,
    summary="Mark a message as read",
)
def mark_message_as_read(
    message_id: str,
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> MessageResponse:

    return chat_service.mark_message_as_read(
        current_user=current_user,
        message_id=message_id,
    )


@router.patch(
    "/conversations/{conversation_id}/read",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Mark conversation messages as read",
)
def mark_conversation_as_read(
    conversation_id: str,
    current_user: dict = Depends(get_current_user),
    chat_service: ChatService = Depends(get_chat_service),
) -> None:

    chat_service.mark_conversation_as_read(
        current_user=current_user,
        conversation_id=conversation_id,
    )

    return None