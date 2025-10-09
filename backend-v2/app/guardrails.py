from __future__ import annotations

from pydantic import BaseModel
from agents import (
    Agent,
    GuardrailFunctionOutput,
    RunContextWrapper,
    Runner,
    TResponseInputItem,
    input_guardrail,
)


class TopicCheckOutput(BaseModel):
    """Output from the topic check guardrail."""
    reasoning: str
    is_marketing_related: bool
    suggested_response: str | None = None


# Fast, cheap model for guardrails
GUARDRAIL_AGENT = Agent(
    model="gpt-4o-mini",  # Fast & cheap for checks
    name="Topic Guardrail",
    instructions="""
    You check if user requests are about social media marketing, viral content, 
    or business strategy that Jason Cooperson would help with.
    
    ALLOW:
    - Social media marketing questions
    - Viral content strategy
    - Video scripts, hooks, CTAs
    - Funnel building, ICP, audience targeting
    - Platform algorithms (TikTok, Instagram, YouTube)
    - Content creation and growth tactics
    - General greetings and conversational exchanges
    - Questions about Jason or his expertise
    
    REJECT with suggested_response:
    - Math homework
    - Medical or legal advice
    - Programming help (unless it's for marketing automation)
    - General life advice unrelated to marketing
    - Requests for illegal/unethical marketing
    - Completely off-topic subjects
    
    Be lenient - if it could relate to marketing, allow it.
    If rejecting, provide a friendly suggested_response that redirects them back to marketing topics.
    """,
    output_type=TopicCheckOutput,
)


@input_guardrail
async def topic_guardrail(
    context: RunContextWrapper[None],
    agent: Agent,
    input: str | list[TResponseInputItem],
) -> GuardrailFunctionOutput:
    """
    Runs in parallel with the main agent to check if input is on-topic.
    If not, immediately stops execution and returns suggested response.
    """
    result = await Runner.run(GUARDRAIL_AGENT, input, context=context.context)
    check = result.final_output_as(TopicCheckOutput)
    
    return GuardrailFunctionOutput(
        output_info={
            "reasoning": check.reasoning,
            "suggested_response": check.suggested_response,
        },
        tripwire_triggered=not check.is_marketing_related,
    )

