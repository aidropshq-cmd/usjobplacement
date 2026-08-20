import re

from rest_framework import serializers

from .models import ContactMessage, Lead


class LeadSerializer(serializers.ModelSerializer):
    """Public lead intake.

    `website` is a honeypot: a real browser never fills a field hidden from
    layout, so anything in it is a bot. We reject it as a normal validation
    error rather than a distinctive one — a bot that learns which response
    means "caught" is a bot that adapts.
    """

    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = Lead
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "work_authorization",
            "target_roles",
            "linkedin_url",
            "message",
            "website",
        ]
        read_only_fields = ["id"]
        extra_kwargs = {
            "full_name": {"required": True, "allow_blank": False},
            "email": {"required": True, "allow_blank": False},
        }

    def validate_website(self, value: str) -> str:
        if value:
            raise serializers.ValidationError("Invalid submission.")
        return value

    def validate_full_name(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Enter your full name.")
        return cleaned

    def validate_phone(self, value: str) -> str:
        """US numbers only, mirroring src/lib/phone.ts.

        Enforced here as well as in the browser because this endpoint is
        public — client-side validation is a convenience for real users, not
        a control. Stored canonically as +1XXXXXXXXXX.

        Tradeoff worth remembering: this rejects international students who
        have not arrived in the US yet and still carry a home-country number.
        If that changes, relax this AND isValidUsPhone in the frontend.
        """
        if not value:
            return ""

        digits = re.sub(r"\D", "", value)
        if len(digits) == 11 and digits.startswith("1"):
            digits = digits[1:]

        # NANP: 10 digits, area and exchange codes start 2-9, no N11 area code.
        valid = (
            len(digits) == 10
            and re.fullmatch(r"[2-9]\d\d", digits[:3]) is not None
            and not digits[:3].endswith("11")
            and re.fullmatch(r"[2-9]\d\d", digits[3:6]) is not None
        )
        if not valid:
            raise serializers.ValidationError(
                "Enter a US phone number, like +1 (555) 000-0000"
            )

        return f"+1{digits}"

    def validate_message(self, value: str) -> str:
        # Long enough for real context, short enough that the field is not a
        # useful place to paste a spam payload.
        if len(value) > 4000:
            raise serializers.ValidationError(
                "Keep this under 4000 characters — you can tell us the rest on the call."
            )
        return value.strip()

    def create(self, validated_data):
        validated_data.pop("website", None)
        return super().create(validated_data)


class ContactMessageSerializer(serializers.ModelSerializer):
    website = serializers.CharField(required=False, allow_blank=True, write_only=True)

    class Meta:
        model = ContactMessage
        fields = ["id", "name", "email", "message", "website"]
        read_only_fields = ["id"]

    def validate_website(self, value: str) -> str:
        if value:
            raise serializers.ValidationError("Invalid submission.")
        return value

    def validate_message(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 10:
            raise serializers.ValidationError(
                "Tell us a little more — at least a sentence."
            )
        if len(cleaned) > 4000:
            raise serializers.ValidationError("Keep this under 4000 characters.")
        return cleaned

    def create(self, validated_data):
        validated_data.pop("website", None)
        return super().create(validated_data)
