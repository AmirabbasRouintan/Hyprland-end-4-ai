const { Gtk } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

const { Box, Button, Icon, Label, Revealer, Scrollable } = Widget;
import GeminiService from "../../../services/gemini.js";
import {
  setupCursorHover,
  setupCursorHoverInfo,
} from "../../.widgetutils/cursorhover.js";
import { SystemMessage, ChatMessage } from "./ai_chatmessage.js";
import {
  ConfigSegmentedSelection,
  ConfigGap,
} from "../../.commonwidgets/configwidgets.js";
import { MarginRevealer } from "../../.widgethacks/advancedrevealers.js";
import { AgsToggle } from "../../.commonwidgets/configwidgets_apps.js";

const MODEL_NAME = `Gemini`;

export const geminiTabIcon = Icon({
  hpack: "center",
  icon: `google-gemini-symbolic`,
});

const GeminiInfo = () => {
  const geminiLogo = Icon({
    hpack: "center",
    className: "sidebar-chat-welcome-logo",
    icon: `google-gemini-symbolic`,
  });
  return Box({
    vertical: true,
    className: "spacing-v-15",
    children: [
      geminiLogo,
      Label({
        className: "txt txt-title-small sidebar-chat-welcome-txt",
        wrap: true,
        justify: Gtk.Justification.CENTER,
        label: `Assistant (Gemini)`,
      }),
      Box({
        className: "spacing-h-5",
        hpack: "center",
        children: [
          Label({
            className: "txt-smallie txt-subtext",
            wrap: true,
            justify: Gtk.Justification.CENTER,
            label: "Powered by Google",
          }),
        ],
      }),
    ],
  });
};

export const GeminiSettings = () =>
  MarginRevealer({
    transition: "slide_down",
    revealChild: true,
    extraSetup: (self) =>
      self
        .hook(
          GeminiService,
          (self) =>
            Utils.timeout(200, () => {
              self.attribute.hide();
            }),
          "newMsg",
        )
        .hook(
          GeminiService,
          (self) =>
            Utils.timeout(200, () => {
              self.attribute.show();
            }),
          "clear",
        ),
    child: Box({
      vertical: true,
      className: "sidebar-chat-settings",
      children: [
        ConfigSegmentedSelection({
          hpack: "center",
          icon: "casino",
          name: "Randomness",
          desc: "Gemini's temperature value.\n  Precise = 0\n  Balanced = 0.5\n  Creative = 1",
          options: [
            { value: 0.0, name: "Precise" },
            { value: 0.5, name: "Balanced" },
            { value: 1.0, name: "Creative" },
          ],
          initIndex: 1,
          onChange: (value, name) => {
            GeminiService.temperature = value;
          },
        }),
        ConfigGap({ vertical: true, size: 10 }),
        Box({
          vertical: true,
          hpack: "center",
          className: "sidebar-chat-settings-toggles",
          children: [
            AgsToggle({
              icon: "model_training",
              name: "Prompt",
              desc: "Tells Gemini:\n- It's a Linux sidebar assistant\n- Be brief and use bullet points",
              option: "ai.enhancements",
              extraOnChange: (self, newValue) => {
                GeminiService.assistantPrompt = newValue;
              },
            }),
            AgsToggle({
              icon: "shield",
              name: "Safety",
              desc: "When turned off, tells the API (not the model) \nto not block harmful/explicit content",
              option: "ai.safety",
              extraOnChange: (self, newValue) => {
                GeminiService.safe = newValue;
              },
            }),
            AgsToggle({
              icon: "history",
              name: "History",
              desc: "Saves chat history\nMessages in previous chats won't show automatically, but they are there",
              option: "ai.useHistory",
              extraOnChange: (self, newValue) => {
                GeminiService.useHistory = newValue;
              },
            }),
            Box({
              className: "spacing-h-1",
              children: [
                AgsToggle({
                  icon: "lan",
                  name: "Proxy",
                  desc: "Route API requests through a SOCKS5 proxy\n(127.0.0.1:2080)",
                  option: "ai.useProxy",
                  extraOnChange: (self, newValue) => {
                    GeminiService.useProxy = newValue;
                  },
                }),
                Button({
                  className: "sidebar-chat-chip-action",
                  hpack: "end",
                  hexpand: true,
                  setup: setupCursorHover,
                  child: Icon("network-wired-symbolic"),
                  tooltipText: "Test network/proxy connection to Cloudflare",
                  onClicked: () => {
                    const useProxy = GeminiService.useProxy;
                    const testType = useProxy ? "Proxy" : "Network";
                    const command = useProxy
                      ? `curl -o /dev/null -s -w '%{time_total}s' --connect-timeout 5 -x socks5h://127.0.0.1:2080 https://1.1.1.1`
                      : `curl -o /dev/null -s -w '%{time_total}s' --connect-timeout 5 https://1.1.1.1`;

                    Utils.execAsync(["bash", "-c", command])
                      .then((latency) => {
                        if (latency && parseFloat(latency) > 0) {
                          chatContent.add(
                            SystemMessage(
                              `${testType} latency: \`${latency.trim()}\``,
                              `${testType} Test`,
                              GeminiView,
                            ),
                          );
                        } else {
                          chatContent.add(
                            SystemMessage(
                              `${testType} test failed.`,
                              `${testType} Test`,
                              GeminiView,
                            ),
                          );
                        }
                      })
                      .catch((err) => {
                        chatContent.add(
                          SystemMessage(
                            `${testType} test failed.\n\nError:\n\`\`\`\n${err}\n\`\`\``,
                            `${testType} Test`,
                            GeminiView,
                          ),
                        );
                      });
                  },
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });

export const GoogleAiInstructions = () =>
  Box({
    homogeneous: true,
    children: [
      Revealer({
        transition: "slide_down",
        setup: (self) =>
          self.hook(
            GeminiService,
            (self, hasKey) => {
              self.revealChild = !hasKey;
            },
            "hasKey",
          ),
        child: Button({
          child: Label({
            useMarkup: true,
            wrap: true,
            className: "txt sidebar-chat-welcome-txt",
            justify: Gtk.Justification.CENTER,
            label:
              "A Google AI API key is required\nYou can grab one <u>here</u>, then enter it below",
          }),
          setup: setupCursorHover,
          onClicked: () =>
            Utils.execAsync([
              "xdg-open",
              "https://makersuite.google.com/app/apikey",
            ]),
        }),
      }),
    ],
  });

const geminiWelcome = Box({
  vexpand: true,
  homogeneous: true,
  child: Box({
    className: "spacing-v-15 margin-top-15 margin-bottom-15",
    vpack: "center",
    vertical: true,
    children: [GeminiInfo(), GoogleAiInstructions(), GeminiSettings()],
  }),
});

export const chatContent = Box({
  className: "spacing-v-5",
  vertical: true,
  setup: (self) =>
    self.hook(
      GeminiService,
      (box, id) => {
        const message = GeminiService.messages[id];
        if (!message) return;
        box.add(ChatMessage(message, MODEL_NAME));
      },
      "newMsg",
    ),
});

const clearChat = () => {
  GeminiService.clear();
  const children = chatContent.get_children();
  for (let i = 0; i < children.length; i++) {
    children[i].destroy();
  }
};

const CommandButton = (command) =>
  Button({
    className: "sidebar-chat-chip sidebar-chat-chip-action txt txt-small",
    onClicked: () => sendMessage(command),
    setup: setupCursorHover,
    label: command,
  });

export const geminiCommands = Box({
  className: "spacing-h-5",
  children: [
    Box({ hexpand: true }),
    CommandButton("/key"),
    CommandButton("/model"),
    CommandButton("/clear"),
  ],
});

export const sendMessage = (text) => {
  if (text.length == 0) return;
  if (GeminiService.key.length == 0) {
    GeminiService.key = text;
    chatContent.add(
      SystemMessage(
        `Key saved to \`${GeminiService.keyPath}\``,
        "API Key",
        GeminiView,
      ),
    );
    return;
  }

  if (text.startsWith("/")) {
    if (text.startsWith("/clear")) clearChat();
    else if (text.startsWith("/load")) {
      clearChat();
      GeminiService.loadHistory();
    } else if (text.startsWith("/model"))
      chatContent.add(
        SystemMessage(
          `Currently using \`${GeminiService.modelName}\``,
          "/model",
          GeminiView,
        ),
      );
    else if (text.startsWith("/key")) {
      const parts = text.split(" ");
      if (parts.length === 1) {
        chatContent.add(
          SystemMessage(
            `Key stored in:\n\`${GeminiService.keyPath}\`\nTo update, type \`/key YOUR_API_KEY\``,
            "/key",
            GeminiView,
          ),
        );
      } else {
        GeminiService.key = parts[1];
        chatContent.add(
          SystemMessage(
            `Updated API Key at\n\`${GeminiService.keyPath}\``,
            "/key",
            GeminiView,
          ),
        );
      }
    } else {
      chatContent.add(SystemMessage(`Invalid command.`, "Error", GeminiView));
    }
  } else {
    GeminiService.send(text);
  }
};

export const GeminiView = (chatEntry) =>
  Box({
    homogeneous: true,
    children: [
      Scrollable({
        className: "sidebar-chat-viewport",
        vexpand: true,
        child: Box({
          vertical: true,
          children: [geminiWelcome, chatContent],
        }),
        setup: (scrolledWindow) => {
          scrolledWindow.set_policy(
            Gtk.PolicyType.NEVER,
            Gtk.PolicyType.AUTOMATIC,
          );
          const vScrollbar = scrolledWindow.get_vscrollbar();
          vScrollbar.get_style_context().add_class("sidebar-scrollbar");
          const adjustment = scrolledWindow.get_vadjustment();
          adjustment.connect("changed", () => {
            if (!chatEntry.hasFocus) return;
            adjustment.set_value(
              adjustment.get_upper() - adjustment.get_page_size(),
            );
          });
        },
      }),
    ],
  });
