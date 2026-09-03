"""Provider mail générique"""

from mailer.client import MailerError, send_email

__all__ = ["MailerError", "send_email"]
