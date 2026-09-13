import os
from slack_bolt import App
from slack_sdk import WebClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Slack Bolt App
app = App(
    token=os.environ.get("SLACK_BOT_TOKEN"),
    signing_secret=os.environ.get("SLACK_SIGNING_SECRET")
)

client = WebClient(token=os.environ.get("SLACK_BOT_TOKEN"))

@app.event("app_mention")
def handle_app_mentions(event, say, logger):
    """
    Placeholder handler for when the Chronicle bot is mentioned in a channel.
    Sprint 0 placeholder to ensure correct environment setup.
    """
    user_id = event.get("user")
    say(f"Greetings <@{user_id}>! Chronicle AI is active. Organizational memory logging is active for this conversation.")

@app.event("message")
def handle_message_events(event, say, logger):
    """
    Placeholder handler for monitoring all message events inside monitored channels.
    Will build the conversational memory pipeline in future sprints.
    """
    # Simply ignore bot messages to avoid loops
    if event.get("bot_id") is not None:
        return
        
    text = event.get("text")
    channel = event.get("channel")
    ts = event.get("ts")
    thread_ts = event.get("thread_ts")
    
    logger.info(f"Message received in channel {channel}: '{text}' (ts: {ts}, thread: {thread_ts})")

@app.command("/chronicle-query")
def handle_query_command(ack, respond, command):
    """
    Slash command `/chronicle-query <topic>` to query the organizational reasoning engine.
    """
    ack()
    user_id = command.get("user_id")
    text = command.get("text")
    respond({
        "response_type": "ephemeral",
        "text": f"Searching organization's memory for: *{text}*... (Sprint 0 foundation OK)"
    })

if __name__ == "__main__":
    port = int(os.environ.get("SLACK_PORT", 3001))
    app.start(port=port)
