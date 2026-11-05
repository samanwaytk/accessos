from typing import Annotated, Literal, Union

from pydantic import BaseModel, Field, TypeAdapter


class CommandMessage(BaseModel):
    type: Literal["command"]
    request_id: str = Field(min_length=1, max_length=64)
    text: str = Field(max_length=2_000)


class PingMessage(BaseModel):
    type: Literal["ping"]
    request_id: str = Field(min_length=1, max_length=64)


IncomingMessage = Annotated[Union[CommandMessage, PingMessage], Field(discriminator="type")]
incoming_message_adapter = TypeAdapter(IncomingMessage)


class AssistantReplyMessage(BaseModel):
    type: Literal["assistant_reply"] = "assistant_reply"
    request_id: str
    text: str
    intent: str


class PongMessage(BaseModel):
    type: Literal["pong"] = "pong"
    request_id: str


class ErrorMessage(BaseModel):
    type: Literal["error"] = "error"
    text: str
    request_id: str | None = None
