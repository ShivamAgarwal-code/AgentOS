import { App, ExpressReceiver } from "@slack/bolt";
import express from "express";
import { AIReasoningService } from "./aiReasoningService";

export type SlackStatus = "connected" | "missing" | "invalid";
let slackStatus: SlackStatus = "missing";

export function getSlackStatus(): SlackStatus {
  return slackStatus;
}

let activeReplaysListRef: any[] = [];
let onNewReplayCallback: ((replay: any) => void) | null = null;

// User real names cache
const userCache = new Map<string, string>();

async function getUserName(client: any, userId: string): Promise<string> {
  if (!userId) return "System";
  if (userCache.has(userId)) {
    return userCache.get(userId)!;
  }
  try {
    const res = await client.users.info({ user: userId });
    if (res.ok && res.user) {
      const name = res.user.real_name || res.user.name || userId;
      userCache.set(userId, name);
      return name;
    }
  } catch (err) {
    console.warn(`[Slack Agent] Failed to fetch user info for ${userId}:`, err);
  }
  return userId;
}

export function initSlackAgent(
  expressApp: express.Application,
  activeReplaysList: any[],
  onNewReplay: (replay: any) => void
) {
  activeReplaysListRef = activeReplaysList;
  onNewReplayCallback = onNewReplay;

  const botToken = process.env.SLACK_BOT_TOKEN;
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!botToken || !signingSecret) {
    console.warn(
      "[Slack Agent] Missing SLACK_BOT_TOKEN or SLACK_SIGNING_SECRET. Slack agent features are disabled."
    );
    slackStatus = "missing";
    return;
  }

  try {
    console.log("[Slack Agent] Initializing Slack Bolt receiver and app...");

    const receiver = new ExpressReceiver({
      signingSecret: signingSecret,
      endpoints: "/slack/events",
      processBeforeResponse: true,
    });

    const slackApp = new App({
      token: botToken,
      receiver,
      tokenVerificationEnabled: false,
    });

    // Verify credentials asynchronously
    (async () => {
      try {
        console.log("[Slack Agent] Testing Slack credentials via auth.test...");
        const authResult = await slackApp.client.auth.test();
        if (authResult.ok) {
          slackStatus = "connected";
          console.log(`[Slack Agent] Slack credentials verified successfully. Bot User ID: ${authResult.bot_id}`);
        } else {
          slackStatus = "invalid";
          console.warn("Slack integration unavailable: invalid credentials.");
        }
      } catch (err: any) {
        slackStatus = "invalid";
        console.warn("Slack integration unavailable: invalid credentials.");
      }
    })();

    // Mount Bolt receiver onto our existing Express app
    expressApp.use(receiver.router);

    // 1. Slash command: /chronicle analyze
    slackApp.command("/chronicle", async ({ command, ack, client, respond }) => {
      await ack();

      const text = command.text ? command.text.trim() : "";
      const channelId = command.channel_id;
      const channelName = command.channel_name;
      const userId = command.user_id;

      if (text.toLowerCase() === "analyze") {
        // Fetch recent channel history (e.g., 30 messages)
        await respond({
          response_type: "ephemeral",
          text: `🔍 *Chronicle AI is scanning #${channelName}...* Preparing to synthesize recent channel conversation into a structured decision replay.`
        });

        // Run async analysis in background to avoid Slack 3s timeout
        setTimeout(async () => {
          try {
            console.log(`[Slack Agent] Fetching history for channel ${channelId} (${channelName})...`);
            const history = await client.conversations.history({
              channel: channelId,
              limit: 30
            });

            if (!history.ok || !history.messages || history.messages.length === 0) {
              await client.chat.postEphemeral({
                channel: channelId,
                user: userId,
                text: `⚠️ Could not retrieve any message history for channel <#${channelId}> to analyze.`
              });
              return;
            }

            // Reverse to Chronological order
            const messages = [...history.messages].reverse();
            const transcriptLines: string[] = [];
            for (const msg of messages) {
              if (msg.bot_id) continue;
              const name = await getUserName(client, msg.user || "");
              transcriptLines.push(`${name}: ${msg.text}`);
            }

            const transcript = transcriptLines.join("\n");
            if (!transcript.trim()) {
              await client.chat.postEphemeral({
                channel: channelId,
                user: userId,
                text: "⚠️ Conversation transcript is empty or only contains bot messages."
              });
              return;
            }

            console.log("[Slack Agent] Synthesizing decision from channel history...");
            const replay = await AIReasoningService.generateReplayFromConversation(transcript);
            
            // Assign new sequential ID
            const nextId = activeReplaysListRef.length > 0
              ? Math.max(...activeReplaysListRef.map(r => r.id)) + 1
              : 1;

            const fullReplay = {
              ...replay,
              id: nextId,
              channel: `#${channelName}`
            };

            // Call callbacks to register replay on global memory
            if (onNewReplayCallback) {
              onNewReplayCallback(fullReplay);
            }

            // Post elegant bot message publicly in channel
            await client.chat.postMessage({
              channel: channelId,
              text: `📊 *Chronicle Replay:* ${fullReplay.title}`,
              blocks: [
                {
                  type: "header",
                  text: {
                    type: "plain_text",
                    text: `📊 Chronicle Replay: ${fullReplay.title.slice(0, 80)}`,
                    emoji: true
                  }
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Decision Summary:*\n${fullReplay.decision}`
                  }
                },
                {
                  type: "section",
                  fields: [
                    {
                      type: "mrkdwn",
                      text: `*Confidence Score:*\n\`${fullReplay.confidence_score}%\``
                    },
                    {
                      type: "mrkdwn",
                      text: `*Project:*\n\`${fullReplay.project || "N/A"}\``
                    }
                  ]
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Business Impact:*\n${fullReplay.impact}`
                  }
                },
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*Key Tradeoffs:*\n${fullReplay.tradeoffs.map((t: string) => `• ${t}`).join("\n")}`
                  }
                },
                {
                  type: "actions",
                  elements: [
                    {
                      type: "button",
                      text: {
                        type: "plain_text",
                        text: "Open Replay",
                        emoji: true
                      },
                      style: "primary",
                      url: `${process.env.APP_URL || "http://localhost:3000"}/?replay=${fullReplay.id}`,
                      action_id: "open_replay_btn"
                    }
                  ]
                }
              ]
            });

          } catch (error: any) {
            console.error("[Slack Agent] Failed command analysis:", error);
            await client.chat.postEphemeral({
              channel: channelId,
              user: userId,
              text: `❌ Analysis failed: ${error.message || "Unknown error occurred"}`
            });
          }
        }, 50);

      } else {
        await respond({
          response_type: "ephemeral",
          text: "ℹ️ *Chronicle Agent Commands:*\n• `/chronicle analyze` - Analyzes recent conversation in the channel to map out organizational memory."
        });
      }
    });

    // 2. App Home view publisher
    slackApp.event("app_home_opened", async ({ event, client }) => {
      try {
        console.log(`[Slack Agent] Publishing App Home for user ${event.user}...`);
        const blocks: any[] = [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: "Chronicle AI - Organizational Memory Hub",
              emoji: true
            }
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "Welcome to *Chronicle AI*! Chronicle translates messy, scattered Slack discussions into structured architectural decisions, alternatives, and verified expert paths."
            }
          },
          {
            type: "divider"
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*Recent Chronicle Analyses*"
            }
          }
        ];

        if (activeReplaysListRef.length === 0) {
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: "_No decisions captured yet. Run `/chronicle analyze` in any channel or use the message shortcut to analyze a conversation!_"
            }
          });
        } else {
          activeReplaysListRef.slice(0, 10).forEach((replay: any) => {
            blocks.push(
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${replay.title}*\n*Channel:* \`${replay.channel || "#general"}\`  •  *Project:* \`${replay.project || "N/A"}\`  •  *Confidence:* \`${replay.confidence_score || 90}%\`\n> ${replay.decision || "Decision logged successfully."}`
                },
                accessory: {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Open Replay",
                    emoji: true
                  },
                  url: `${process.env.APP_URL || "http://localhost:3000"}/?replay=${replay.id}`,
                  action_id: `view_replay_${replay.id}`
                }
              },
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `*Impact:* ${replay.impact || "N/A"}`
                  }
                ]
              },
              {
                type: "divider"
              }
            );
          });
        }

        await client.views.publish({
          user_id: event.user,
          view: {
            type: "home",
            blocks: blocks
          }
        });
      } catch (error) {
        console.error("[Slack Agent] Error publishing App Home view:", error);
      }
    });

    // 4. Message Shortcut & 5. Thread Support
    slackApp.shortcut("chronicle_analyze_conversation", async ({ shortcut, ack, client }) => {
      await ack();

      const messageShortcut = shortcut as any;
      const channelId = messageShortcut.channel.id;
      const channelName = messageShortcut.channel.name || "channel";
      const messageTs = messageShortcut.message.ts;
      const threadTs = messageShortcut.message.thread_ts;
      const userId = messageShortcut.user.id;

      await client.chat.postEphemeral({
        channel: channelId,
        user: userId,
        text: `🔍 *Chronicle AI is scanning conversation...* Attempting to trace thread details and compile architectural memory.`
      });

      // Background synthesis
      setTimeout(async () => {
        try {
          console.log(`[Slack Agent] Retrieving conversational threads for message ${messageTs}...`);
          
          // Use replies API if it is a thread, or to fetch thread details
          const response = await client.conversations.replies({
            channel: channelId,
            ts: threadTs || messageTs,
            limit: 50
          });

          if (!response.ok || !response.messages || response.messages.length === 0) {
            await client.chat.postEphemeral({
              channel: channelId,
              user: userId,
              text: "⚠️ Could not retrieve message replies or content for this conversation."
            });
            return;
          }

          const transcriptLines: string[] = [];
          for (const msg of response.messages) {
            if (msg.bot_id) continue;
            const name = await getUserName(client, msg.user || "");
            transcriptLines.push(`${name}: ${msg.text}`);
          }

          const transcript = transcriptLines.join("\n");
          if (!transcript.trim()) {
            await client.chat.postEphemeral({
              channel: channelId,
              user: userId,
              text: "⚠️ Selected conversation transcript is empty or only contains bot messages."
            });
            return;
          }

          console.log("[Slack Agent] Generating replay from selected shortcut conversation...");
          const replay = await AIReasoningService.generateReplayFromConversation(transcript);

          const nextId = activeReplaysListRef.length > 0
            ? Math.max(...activeReplaysListRef.map(r => r.id)) + 1
            : 1;

          const fullReplay = {
            ...replay,
            id: nextId,
            channel: `#${channelName}`
          };

          if (onNewReplayCallback) {
            onNewReplayCallback(fullReplay);
          }

          // Post elegant bot message back into the thread or channel
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: threadTs || messageTs, // Reply directly in thread if it was a thread discussion!
            text: `📊 *Chronicle Replay:* ${fullReplay.title}`,
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `📊 Chronicle Replay: ${fullReplay.title.slice(0, 80)}`,
                  emoji: true
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Decision Summary:*\n${fullReplay.decision}`
                }
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*Confidence Score:*\n\`${fullReplay.confidence_score}%\``
                  },
                  {
                    type: "mrkdwn",
                    text: `*Project:*\n\`${fullReplay.project || "N/A"}\``
                  }
                ]
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Business Impact:*\n${fullReplay.impact}`
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Key Tradeoffs:*\n${fullReplay.tradeoffs.map((t: string) => `• ${t}`).join("\n")}`
                }
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Open Replay",
                      emoji: true
                    },
                    style: "primary",
                    url: `${process.env.APP_URL || "http://localhost:3000"}/?replay=${fullReplay.id}`,
                    action_id: "open_replay_btn"
                  }
                ]
              }
            ]
          });

        } catch (error: any) {
          console.error("[Slack Agent] Failed message action analysis:", error);
          await client.chat.postEphemeral({
            channel: channelId,
            user: userId,
            text: `❌ Analysis failed: ${error.message || "Unknown error occurred"}`
          });
        }
      }, 50);
    });

    // 5. App Mentions listener with robust diagnostic logging and error handling
    slackApp.event("app_mention", async ({ event, client }) => {
      const channelId = event.channel;
      const userId = event.user;
      const threadTs = event.thread_ts || event.ts;
      const eventText = event.text || "";

      console.log(`[Slack Event] [app_mention] Incoming mention from user ${userId} in channel ${channelId}`);
      console.log(`[Slack Event] [app_mention] Content: "${eventText.substring(0, 150)}"`);

      try {
        // Step 1: Join the conversation/channel correctly
        try {
          console.log(`[Slack Step] [1/5] Joining/Verifying channel presence for ${channelId}...`);
          await client.conversations.join({ channel: channelId });
          console.log(`[Slack Step] [1/5] Channel presence verified for channel ${channelId}`);
        } catch (joinErr: any) {
          console.warn(`[Slack Step] [1/5] Note: Optional channel join returned message: "${joinErr.message || joinErr}". Continuing gracefully.`);
        }

        // Step 2: Send a confirmation reply back into Slack
        console.log(`[Slack Step] [2/5] Dispatching confirmation reply to channel ${channelId}...`);
        await client.chat.postMessage({
          channel: channelId,
          thread_ts: threadTs,
          text: `🧠 *Chronicle AI: App Mention Received!* I am stepping into this thread to extract decision context. Beginning conversation trace and AI reasoning sequence...`
        });

        // Step 3: Fetch history to forward to Chronicle reasoning pipeline
        console.log(`[Slack Step] [3/5] Retrieving recent channel conversation history...`);
        let history;
        try {
          history = await client.conversations.history({
            channel: channelId,
            limit: 30
          });
        } catch (histErr: any) {
          console.error(`[Slack Step] [3/5] Failed to fetch channel history: ${histErr.message || histErr}`);
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: threadTs,
            text: `⚠️ *History Permission Error:* I am unable to read message history in this channel. Please ensure the bot is added to this channel and has 'channels:history' or 'groups:history' scopes.`
          });
          return;
        }

        if (!history.ok || !history.messages || history.messages.length === 0) {
          console.warn(`[Slack Step] [3/5] History check returned empty results for channel ${channelId}`);
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: threadTs,
            text: `⚠️ Could not retrieve any message history for channel <#${channelId}> to analyze.`
          });
          return;
        }

        // Chronological trace conversion
        const messages = [...history.messages].reverse();
        const transcriptLines: string[] = [];
        for (const msg of messages) {
          if (msg.bot_id) continue;
          const name = await getUserName(client, msg.user || "");
          transcriptLines.push(`${name}: ${msg.text}`);
        }

        const transcript = transcriptLines.join("\n");
        if (!transcript.trim()) {
          console.warn(`[Slack Step] [3/5] No user messages found in history for channel ${channelId}`);
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: threadTs,
            text: "⚠️ Selected conversation transcript is empty or only contains bot messages."
          });
          return;
        }

        console.log(`[Slack Step] [3/5] Compiled conversation transcript of ${transcriptLines.length} messages.`);

        // Step 4: Forward conversation text into the existing Chronicle reasoning pipeline
        console.log(`[Slack Step] [4/5] Sending transcript to Claude-powered AgentOS reasoning pipeline...`);
        const replay = await AIReasoningService.generateReplayFromConversation(transcript);

        const nextId = activeReplaysListRef.length > 0
          ? Math.max(...activeReplaysListRef.map(r => r.id)) + 1
          : 1;

        const fullReplay = {
          ...replay,
          id: nextId,
          channel: `#${channelId}`
        };

        try {
          const info = await client.conversations.info({ channel: channelId });
          if (info.ok && info.channel && info.channel.name) {
            fullReplay.channel = `#${info.channel.name}`;
          }
        } catch (infoErr) {
          console.warn("[Slack Agent] Failed to fetch channel name during app_mention, using ID fallback:", infoErr);
        }

        // Step 5: Create a Decision Replay and update backend store automatically
        console.log(`[Slack Step] [5/5] Storing generated Decision Replay (ID: ${fullReplay.id}) into backend...`);
        if (onNewReplayCallback) {
          onNewReplayCallback(fullReplay);
        }

        // Post elegant confirmation and result blocks back to Slack
        console.log(`[Slack Agent] Successfully analyzed app_mention. Posting results to Slack...`);
        await client.chat.postMessage({
          channel: channelId,
          thread_ts: threadTs,
          text: `📊 *Chronicle Replay:* ${fullReplay.title}`,
          blocks: [
            {
              type: "header",
              text: {
                type: "plain_text",
                text: `📊 Chronicle Replay: ${fullReplay.title.slice(0, 80)}`,
                emoji: true
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Decision Summary:*\n${fullReplay.decision}`
              }
            },
            {
              type: "section",
              fields: [
                {
                  type: "mrkdwn",
                  text: `*Confidence Score:*\n\`${fullReplay.confidence_score}%\``
                },
                {
                  type: "mrkdwn",
                  text: `*Project:*\n\`${fullReplay.project || "N/A"}\``
                }
              ]
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Business Impact:*\n${fullReplay.impact}`
              }
            },
            {
              type: "section",
              text: {
                type: "mrkdwn",
                text: `*Key Tradeoffs:*\n${fullReplay.tradeoffs.map((t: string) => `• ${t}`).join("\n")}`
              }
            },
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: {
                    type: "plain_text",
                    text: "Open Replay",
                    emoji: true
                  },
                  style: "primary",
                  url: `${process.env.APP_URL || "http://localhost:3000"}/?replay=${fullReplay.id}`,
                  action_id: "open_replay_btn"
                }
              ]
            }
          ]
        });

      } catch (error: any) {
        console.error(`[Slack Agent] Exception caught in app_mention event handler:`, error.message || error);
      }
    });

    // 6. Message Event listener to monitor conversations in channels where the bot is present
    slackApp.event("message", async ({ event, client }) => {
      const msgEvent = event as any;
      // Ignore app mentions.
      // They are already handled by the app_mention handler.
      if (msgEvent.text?.includes("<@")) {
          return;
      }
      // Ignore duplicate/system events
      if (
          msgEvent.bot_id ||
          msgEvent.subtype ||
          !msgEvent.client_msg_id
      ) {
          return;
      }

      const channelId = msgEvent.channel;
      const userId = msgEvent.user;
      const text = msgEvent.text || "";
      const threadTs = msgEvent.thread_ts || msgEvent.ts;

      console.log(`[Slack Event] [message] Received message in channel ${channelId} from user ${userId}`);
      console.log(`[Slack Event] [message] Content preview: "${text.substring(0, 100)}"`);

      try {
        // Trigger if DM or message explicitly contains trigger words like "chronicle" or "analyze"
        const isDM = msgEvent.channel_type === "im";
        const isExplicitTrigger = text.toLowerCase().includes("chronicle") || text.toLowerCase().includes("analyze");

        if (isDM || isExplicitTrigger) {
          console.log(`[Slack Agent] Message trigger matched (DM: ${isDM}, Keyword: ${isExplicitTrigger}). Initiating analysis...`);

          // Step 1: Send confirmation reply back to channel
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: threadTs,
            text: `🧠 *Chronicle Message Trigger Activated:* Scanning conversation thread to trace decision details...`
          });

          // Step 2: Fetch history
          console.log(`[Slack Step] Retrieving thread context history...`);
          const history = await client.conversations.history({
            channel: channelId,
            limit: 30
          });

          if (!history.ok || !history.messages || history.messages.length === 0) {
            console.warn(`[Slack Step] Failed to retrieve message history for message-triggered channel ${channelId}`);
            await client.chat.postMessage({
              channel: channelId,
              thread_ts: threadTs,
              text: `⚠️ Unable to read channel history to generate Decision Replay.`
            });
            return;
          }

          const messages = [...history.messages].reverse();
          const transcriptLines: string[] = [];
          for (const msg of messages) {
            if (msg.bot_id) continue;
            const name = await getUserName(client, msg.user || "");
            transcriptLines.push(`${name}: ${msg.text}`);
          }

          const transcript = transcriptLines.join("\n");
          if (!transcript.trim()) return;

          // Step 3: Forward conversation text into Chronicle reasoning pipeline
          console.log(`[Slack Step] Generating Decision Replay from transcript...`);
          const replay = await AIReasoningService.generateReplayFromConversation(transcript);

          const nextId = activeReplaysListRef.length > 0
            ? Math.max(...activeReplaysListRef.map(r => r.id)) + 1
            : 1;

          const fullReplay = {
            ...replay,
            id: nextId,
            channel: `#${channelId}`
          };

          try {
            const info = await client.conversations.info({ channel: channelId });
            if (info.ok && info.channel && info.channel.name) {
              fullReplay.channel = `#${info.channel.name}`;
            }
          } catch (infoErr) {
            console.warn("[Slack Agent] Failed to fetch channel name during message_trigger:", infoErr);
          }

          // Step 4: Save replay and update Dashboard, Memory Graph, and Decision Replay automatically
          console.log(`[Slack Step] Updating Decision Replay store with ID ${fullReplay.id}`);
          if (onNewReplayCallback) {
            onNewReplayCallback(fullReplay);
          }

          // Step 5: Send confirmation back into Slack
          console.log(`[Slack Agent] Posting generated Decision Replay to channel ${channelId}`);
          await client.chat.postMessage({
            channel: channelId,
            thread_ts: threadTs,
            text: `📊 *Chronicle Replay:* ${fullReplay.title}`,
            blocks: [
              {
                type: "header",
                text: {
                  type: "plain_text",
                  text: `📊 Chronicle Replay: ${fullReplay.title.slice(0, 80)}`,
                  emoji: true
                }
              },
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*Decision Summary:*\n${fullReplay.decision}`
                }
              },
              {
                type: "section",
                fields: [
                  {
                    type: "mrkdwn",
                    text: `*Confidence Score:*\n\`${fullReplay.confidence_score}%\``
                  },
                  {
                    type: "mrkdwn",
                    text: `*Project:*\n\`${fullReplay.project || "N/A"}\``
                  }
                ]
              },
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "Open Replay",
                      emoji: true
                    },
                    style: "primary",
                    url: `${process.env.APP_URL || "http://localhost:3000"}/?replay=${fullReplay.id}`,
                    action_id: "open_replay_btn"
                  }
                ]
              }
            ]
          });
        }
      } catch (error: any) {
        console.error(`[Slack Agent] Exception caught in message event handler:`, error.message || error);
      }
    });

    console.log("[Slack Agent] Slack Bolt handlers successfully configured.");
  } catch (error) {
    console.error("[Slack Agent] Exception during Slack Bolt app setup:", error);
  }
}
