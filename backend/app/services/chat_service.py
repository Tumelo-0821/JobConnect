from fastapi import HTTPException, status

from app.models import ConversationDocument, MessageDocument
from app.repositories.memory import ChatRepository, UserRepository
from app.schemas.chat import (
    ConversationResponse,
    MessageResponse,
)


class ChatService:
    def __init__(
        self,
        chat_repo: ChatRepository,
        user_repo: UserRepository,
        job_repo=None,
    ) -> None:
        self.chat_repo = chat_repo
        self.user_repo = user_repo
        self.job_repo = job_repo

    def add_job_label(
        self,
        current_user: dict,
        conversation_id: str,
        job_id: str,
    ) -> MessageResponse:

        conversation_result = self.chat_repo.get_conversation(
            conversation_id
        )

        if not conversation_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        _, conversation = conversation_result

        current_user_id = str(current_user["id"])

        participants = {
            str(conversation["employer_id"]),
            str(conversation["worker_id"]),
        }

        if current_user_id not in participants:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this conversation",
            )

        job_result = self.job_repo.get_by_id(job_id)

        if not job_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Job not found",
            )

        _, job = job_result

        if str(job.get("employer_id")) != str(conversation["employer_id"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This job does not belong to the employer",
            )

        label_id, label_data = self.chat_repo.create_job_label(
            conversation_id=conversation_id,
            job_id=job_id,
            job_title=job.get("title") or "Job",
        )

        return MessageResponse(
            **MessageDocument.to_response(label_id, label_data)
        )
    # ---------------------------------------------------------
    # CONVERSATION
    # ---------------------------------------------------------

    def get_or_create_conversation(
        self,
        current_user: dict,
        other_user_id: str,
    ) -> ConversationResponse:

        current_user_id = current_user["id"]
        current_role = current_user.get("role")

        other_user_result = self.user_repo.get_by_id(other_user_id)

        if not other_user_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        _, other_user = other_user_result

        other_role = other_user.get("role")

        # -----------------------------------------------------
        # Only employer <-> worker conversations are allowed
        # -----------------------------------------------------

        if current_role == "employer":
            if other_role != "worker":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Employers can only chat with workers",
                )

            employer_id = current_user_id
            worker_id = other_user_id

        elif current_role == "worker":
            if other_role != "employer":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Workers can only chat with employers",
                )

            employer_id = other_user_id
            worker_id = current_user_id

        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid user role",
            )

        # -----------------------------------------------------
        # Check whether conversation already exists
        # -----------------------------------------------------

        existing = self.chat_repo.get_conversation_between_users(
            employer_id=employer_id,
            worker_id=worker_id,
        )

        if existing:
            conversation_id, conversation_data = existing

            return ConversationResponse(
                **ConversationDocument.to_response(
                    conversation_id,
                    conversation_data,
                )
            )

        # -----------------------------------------------------
        # Create new conversation
        # -----------------------------------------------------

        conversation_id, conversation_data = (
            self.chat_repo.create_conversation(
                employer_id=employer_id,
                worker_id=worker_id,
            )
        )

        return ConversationResponse(
            **ConversationDocument.to_response(
                conversation_id,
                conversation_data,
            )
        )

    # ---------------------------------------------------------
    # GET CONVERSATION
    # ---------------------------------------------------------

    def get_conversation(
        self,
        current_user: dict,
        conversation_id: str,
    ) -> ConversationResponse:

        result = self.chat_repo.get_conversation(
            conversation_id
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        conversation_id, data = result

        self._verify_conversation_access(
            current_user,
            data,
        )

        return ConversationResponse(
            **ConversationDocument.to_response(
                conversation_id,
                data,
            )
        )

    # ---------------------------------------------------------
    # SEND MESSAGE
    # ---------------------------------------------------------

    def send_message(
        self,
        current_user: dict,
        conversation_id: str,
        message: str,
    ) -> MessageResponse:

        result = self.chat_repo.get_conversation(
            conversation_id
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        _, conversation_data = result

        self._verify_conversation_access(
            current_user,
            conversation_data,
        )

        message = message.strip()

        if not message:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message cannot be empty",
            )

        message_id, message_data = (
            self.chat_repo.create_message(
                conversation_id=conversation_id,
                sender_id=current_user["id"],
                message=message,
            )
        )

        return MessageResponse(
            **MessageDocument.to_response(
                message_id,
                message_data,
            )
        )

    # ---------------------------------------------------------
    # GET MESSAGES
    # ---------------------------------------------------------

    def list_messages(
        self,
        current_user: dict,
        conversation_id: str,
    ) -> list[MessageResponse]:

        result = self.chat_repo.get_conversation(
            conversation_id
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        _, conversation_data = result

        self._verify_conversation_access(
            current_user,
            conversation_data,
        )

        messages = self.chat_repo.list_messages(
            conversation_id
        )

        return [
            MessageResponse(
                **MessageDocument.to_response(
                    message_id,
                    data,
                )
            )
            for message_id, data in messages
        ]

    # ---------------------------------------------------------
    # MARK MESSAGE AS READ
    # ---------------------------------------------------------

    def mark_message_as_read(
        self,
        current_user: dict,
        message_id: str,
    ) -> MessageResponse:

        message_result = self.chat_repo.get_message(
            message_id
        )

        if not message_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Message not found",
            )

        _, message_data = message_result

        conversation_id = message_data.get(
            "conversation_id"
        )

        if not conversation_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Message has no conversation",
            )

        conversation_result = (
            self.chat_repo.get_conversation(
                conversation_id
            )
        )

        if not conversation_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        _, conversation_data = conversation_result

        self._verify_conversation_access(
            current_user,
            conversation_data,
        )

        updated = self.chat_repo.mark_message_as_read(
            message_id
        )

        return MessageResponse(
            **MessageDocument.to_response(
                message_id,
                updated,
            )
        )

    # ---------------------------------------------------------
    # MARK CONVERSATION AS READ
    # ---------------------------------------------------------

    def mark_conversation_as_read(
        self,
        current_user: dict,
        conversation_id: str,
    ) -> None:

        result = self.chat_repo.get_conversation(
            conversation_id
        )

        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )

        _, conversation_data = result

        self._verify_conversation_access(
            current_user,
            conversation_data,
        )

        self.chat_repo.mark_conversation_messages_as_read(
            conversation_id,
            current_user["id"],
        )

    # ---------------------------------------------------------
    # LIST USER CONVERSATIONS
    # ---------------------------------------------------------

    def list_conversations(
        self,
        current_user: dict,
    ) -> list[ConversationResponse]:

        conversations = (
            self.chat_repo.list_conversations_for_user(
                current_user["id"]
            )
        )

        results = []

        for conversation_id, data in conversations:

            employer_id = data.get("employer_id")
            worker_id = data.get("worker_id")

            employer_result = (
                self.user_repo.get_by_id(employer_id)
                if employer_id else None
            )

            worker_result = (
                self.user_repo.get_by_id(worker_id)
                if worker_id else None
            )

            employer_name = None
            worker_name = None

            if employer_result:
                _, employer = employer_result
                employer_name = (
                    f"{employer.get('first_name') or ''} "
                    f"{employer.get('last_name') or ''}"
                ).strip() or None

            if worker_result:
                _, worker = worker_result
                worker_name = (
                    f"{worker.get('first_name') or ''} "
                    f"{worker.get('last_name') or ''}"
                ).strip() or None

            conversation_data = ConversationDocument.to_response(
                conversation_id,
                data,
            )

            conversation_data["employer_name"] = employer_name
            conversation_data["worker_name"] = worker_name

            results.append(
                ConversationResponse(**conversation_data)
            )

        return results

    # ---------------------------------------------------------
    # ACCESS CONTROL
    # ---------------------------------------------------------

    def _verify_conversation_access(
        self,
        current_user: dict,
        conversation_data: dict,
    ) -> None:

        user_id = current_user["id"]

        employer_id = conversation_data.get(
            "employer_id"
        )

        worker_id = conversation_data.get(
            "worker_id"
        )

        if user_id not in {
            employer_id,
            worker_id,
        }:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this conversation",
            )