from rest_framework import serializers

from .models import Assessment, Candidate, ExperienceLevel, WorkMode, WorkStatusPref


class AssessmentIntakeSerializer(serializers.Serializer):
    """Structured intake for a completed readiness assessment.

    The previous path smuggled the whole result into a Lead's free-text
    `message`, which is fine for an email and useless as data. This keeps the
    scores as numbers so they can be queried, compared and re-scored later.
    """

    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()

    work_status_pref = serializers.ChoiceField(
        choices=WorkStatusPref.choices, required=False, allow_blank=True, default=""
    )
    target_role = serializers.CharField(
        max_length=120, required=False, allow_blank=True, default=""
    )
    experience_level = serializers.ChoiceField(
        choices=ExperienceLevel.choices, required=False, allow_blank=True, default=""
    )
    work_mode = serializers.ChoiceField(
        choices=WorkMode.choices, required=False, allow_blank=True, default=""
    )
    preferred_locations = serializers.CharField(
        required=False, allow_blank=True, default=""
    )

    answers = serializers.JSONField(required=False, default=dict)

    overall = serializers.IntegerField(min_value=0, max_value=100)
    resume_score = serializers.IntegerField(min_value=0, max_value=100)
    targeting_score = serializers.IntegerField(min_value=0, max_value=100)
    ats_score = serializers.IntegerField(min_value=0, max_value=100)
    interview_score = serializers.IntegerField(min_value=0, max_value=100)

    website = serializers.CharField(required=False, allow_blank=True, default="")

    def validate_website(self, value: str) -> str:
        if value:
            raise serializers.ValidationError("Invalid submission.")
        return value

    def validate_full_name(self, value: str) -> str:
        cleaned = value.strip()
        if len(cleaned) < 2:
            raise serializers.ValidationError("Enter your name.")
        return cleaned


class AssessmentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assessment
        fields = ["id", "overall", "resume_score", "targeting_score", "ats_score",
                  "interview_score", "method", "created_at"]


class CandidateSerializer(serializers.ModelSerializer):
    """Candidate-facing shape. `lead_score` is deliberately absent — it is an
    internal triage value and is never serialised to the person it scores."""

    class Meta:
        model = Candidate
        fields = ["id", "full_name", "email", "target_role", "experience_level",
                  "work_status_pref", "work_mode", "preferred_locations", "skills",
                  "created_at"]
        read_only_fields = fields
