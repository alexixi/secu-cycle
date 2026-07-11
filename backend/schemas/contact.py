from pydantic import BaseModel, EmailStr, Field


class ContactMessage(BaseModel):
    """Message soumis depuis le formulaire de contact public."""

    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(min_length=3, max_length=150)
    message: str = Field(min_length=10, max_length=5000)
