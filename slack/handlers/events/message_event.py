# Slack message event handlers placeholder for Sprint 0

def on_message_created(event, client, logger):
    """
    Invoked when a message is posted to Slack. Will route to the pipeline to store
    the message, detect decisions, and update graph nodes.
    """
    logger.info(f"on_message_created event: {event.get('ts')}")
    pass
