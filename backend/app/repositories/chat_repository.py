from datetime import datetime, timezone
from typing import Any

from google.cloud.firestore_v1.base_query import FieldFilter

from app.database import get_firestore
from app.models import ConversationDocument, MessageDocument, new_id, utc_now


class FirestoreChatRepository:
    """
    Firestore repository for conversations and chat messages.

    Firestore structure:

    conversations/
        conversation_id
            employer_id
            worker_id
            created_at
            updated_at

    messages/
        message_id
            conversation_id
            sender_id
            message
            is_read
            created_at
    """

    @property
    def conversations_collection(self):
        return get_firestore().collection("conversations")

    @property
    def messages_collection(self):
        return get_firestore().collection("messages")

    # ---------------------------------------------------------
    # CONVERSATIONS
    # ---------------------------------------------------------

    def create_conversation(
        self,
        employer_id: str,
        worker_id: str,
    ) -> tuple[str, dict[str, Any]]:

        conversation_id = new_id()

        conversation = ConversationDocument.create(
            employer_id=employer_id,
            worker_id=worker_id,
        )

        self.conversations_collection.document(conversation_id).set(
            conversation
        )

        return conversation_id, conversation.copy()

    def get_conversation(
        self,
        conversation_id: str,
    ) -> tuple[str, dict[str, Any]] | None:

        doc = self.conversations_collection.document(
            conversation_id
        ).get()

        if not doc.exists:
            return None

        return doc.id, doc.to_dict()

    def get_conversation_between_users(
        self,
        employer_id: str,
        worker_id: str,
    ) -> tuple[str, dict[str, Any]] | None:

        query = (
            self.conversations_collection
            .where(
                filter=FieldFilter(
                    "employer_id",
                    "==",
                    employer_id,
                )
            )
            .where(
                filter=FieldFilter(
                    "worker_id",
                    "==",
                    worker_id,
                )
            )
            .limit(1)
        )

        docs = list(query.stream())

        if not docs:
            return None

        doc = docs[0]

        return doc.id, doc.to_dict()

    # ---------------------------------------------------------
    # MESSAGES
    # ---------------------------------------------------------

    def create_message(
        self,
        conversation_id: str,
        sender_id: str,
        message: str,
    ) -> tuple[str, dict[str, Any]]:

        conversation = self.get_conversation(conversation_id)

        if not conversation:
            raise KeyError("Conversation not found")

        message_id = new_id()

        message_data = MessageDocument.create(
            conversation_id=conversation_id,
            sender_id=sender_id,
            message=message,
        )

        self.messages_collection.document(message_id).set(
            message_data
        )

        # Update conversation's last activity
        self.conversations_collection.document(
            conversation_id
        ).update(
            {
                "updated_at": utc_now(),
            }
        )

        return message_id, message_data.copy()

    def get_message(
        self,
        message_id: str,
    ) -> tuple[str, dict[str, Any]] | None:

        doc = self.messages_collection.document(
            message_id
        ).get()

        if not doc.exists:
            return None

        return doc.id, doc.to_dict()

    def list_messages(
        self,
        conversation_id: str,
    ) -> list[tuple[str, dict[str, Any]]]:

        query = (
            self.messages_collection
            .where(
                filter=FieldFilter(
                    "conversation_id",
                    "==",
                    conversation_id,
                )
            )
        )

        results = [
            (doc.id, doc.to_dict())
            for doc in query.stream()
        ]

        results.sort(
            key=lambda item: (
                item[1].get("created_at")
                or datetime.min.replace(tzinfo=timezone.utc)
            )
        )

        return results

    # ---------------------------------------------------------
    # READ STATUS
    # ---------------------------------------------------------

    def mark_message_as_read(
        self,
        message_id: str,
    ) -> dict[str, Any]:

        ref = self.messages_collection.document(
            message_id
        )

        if not ref.get().exists:
            raise KeyError("Message not found")

        ref.update(
            {
                "is_read": True,
            }
        )

        return ref.get().to_dict()

    def mark_conversation_messages_as_read(
        self,
        conversation_id: str,
        reader_id: str,
    ) -> None:

        messages = self.list_messages(conversation_id)

        batch = get_firestore().batch()

        for message_id, data in messages:

            # Only mark messages sent by the other person as read
            if (
                data.get("sender_id") != reader_id
                and not data.get("is_read", False)
            ):
                ref = self.messages_collection.document(
                    message_id
                )

                batch.update(
                    ref,
                    {
                        "is_read": True,
                    },
                )

        batch.commit()

    # ---------------------------------------------------------
    # CONVERSATION LIST
    # ---------------------------------------------------------

    def list_conversations_for_user(
        self,
        user_id: str,
    ) -> list[tuple[str, dict[str, Any]]]:

        employer_query = self.conversations_collection.where(
            filter=FieldFilter(
                "employer_id",
                "==",
                user_id,
            )
        )

        worker_query = self.conversations_collection.where(
            filter=FieldFilter(
                "worker_id",
                "==",
                user_id,
            )
        )

        conversations: dict[str, dict[str, Any]] = {}

        for doc in employer_query.stream():
            conversations[doc.id] = doc.to_dict()

        for doc in worker_query.stream():
            conversations[doc.id] = doc.to_dict()

        results = list(conversations.items())

        results.sort(
            key=lambda item: (
                item[1].get("updated_at")
                or item[1].get("created_at")
                or datetime.min.replace(tzinfo=timezone.utc)
            ),
            reverse=True,
        )

        return results