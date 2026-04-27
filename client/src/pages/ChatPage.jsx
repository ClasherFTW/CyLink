import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useAuth } from "../features/auth/AuthContext";
import { useToast } from "../features/ui/ToastContext";
import {
  listChatMessages,
  listChats,
  sendChatMessage,
  startChat,
} from "../features/chat/chatApi";
import { getSocket } from "../features/chat/socketClient";
import { formatRelativeTime } from "../utils/formatters";
import { getId } from "../utils/id";

function resolveOtherParticipant(chat, selfId) {
  const users = chat.participants || [];
  return users.find((user) => getId(user) !== selfId) || users[0] || null;
}

function ChatPage() {
  const { user, token } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const initialParticipant = searchParams.get("participant") || "";

  const [participantId, setParticipantId] = useState(initialParticipant);
  const [activeChatId, setActiveChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingState, setTypingState] = useState({ isTyping: false, userId: "" });

  const selfId = user?.id || user?._id || "";

  const chatsQuery = useQuery({
    queryKey: ["chats"],
    queryFn: () => listChats({ page: 1, limit: 30 }),
  });

  const chatItems = chatsQuery.data?.items || [];

  useEffect(() => {
    if (!activeChatId && chatItems.length > 0) {
      setActiveChatId(chatItems[0]._id);
    }
  }, [activeChatId, chatItems]);

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", activeChatId],
    queryFn: () => listChatMessages(activeChatId, { page: 1, limit: 100 }),
    enabled: Boolean(activeChatId),
  });

  useEffect(() => {
    setMessages(messagesQuery.data?.items || []);
  }, [messagesQuery.data]);

  const startChatMutation = useMutation({
    mutationFn: (targetId) => startChat(targetId),
    onSuccess: (chat) => {
      toast.success("Chat ready");
      setActiveChatId(chat._id);
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
    onError: (error) => {
      toast.error("Could not start chat", error.message || "Check participant id.");
    },
  });

  const sendFallbackMutation = useMutation({
    mutationFn: ({ chatId, content }) => sendChatMessage(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const socket = useMemo(() => getSocket(token), [token]);

  useEffect(() => {
    if (!socket || !activeChatId) return;

    socket.emit("joinRoom", { chatId: activeChatId });

    const onMessage = (message) => {
      if (message.chatId !== activeChatId) {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        return;
      }

      setMessages((prev) => {
        if (prev.some((item) => item._id === message._id)) return prev;
        return [...prev, message];
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    };

    const onTyping = (payload) => {
      if (payload.chatId !== activeChatId || payload.userId === selfId) return;
      setTypingState({ isTyping: payload.isTyping, userId: payload.userId });
    };

    socket.on("receiveMessage", onMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.emit("leaveRoom", { chatId: activeChatId });
      socket.off("receiveMessage", onMessage);
      socket.off("typing", onTyping);
    };
  }, [socket, activeChatId, queryClient, selfId]);

  function handleStartChat(event) {
    event.preventDefault();
    const value = participantId.trim();
    if (!value) return;

    startChatMutation.mutate(value);
  }

  function handleTyping(nextValue) {
    setDraft(nextValue);
    if (!socket || !activeChatId) return;

    socket.emit("typing", {
      chatId: activeChatId,
      isTyping: nextValue.length > 0,
    });
  }

  function handleSendMessage(event) {
    event.preventDefault();

    const content = draft.trim();
    if (!content || !activeChatId) return;

    setDraft("");
    setTypingState({ isTyping: false, userId: "" });

    if (socket) {
      socket.emit(
        "sendMessage",
        {
          chatId: activeChatId,
          content,
        },
        (ack) => {
          if (!ack?.success) {
            sendFallbackMutation.mutate({ chatId: activeChatId, content });
          }
        }
      );
      return;
    }

    sendFallbackMutation.mutate({ chatId: activeChatId, content });
  }

  return (
    <AppShell title="Realtime Chat" subtitle="1-to-1 chat via HTTP + Socket.io">
      <section className="content-panel chat-start-panel">
        <form className="inline-actions" onSubmit={handleStartChat}>
          <input
            value={participantId}
            onChange={(event) => setParticipantId(event.target.value)}
            placeholder="Participant user id"
          />
          <button type="submit" className="btn btn--primary" disabled={startChatMutation.isPending}>
            {startChatMutation.isPending ? "Starting..." : "Start / Open Chat"}
          </button>
        </form>
      </section>

      <section className="chat-layout">
        <aside className="content-panel chat-list-panel">
          <h3>Your Chats</h3>

          {chatsQuery.isLoading ? <p className="muted">Loading chats...</p> : null}

          {chatItems.map((chat) => {
            const partner = resolveOtherParticipant(chat, selfId);
            return (
              <button
                key={chat._id}
                type="button"
                className={`chat-list-item ${chat._id === activeChatId ? "is-active" : ""}`}
                onClick={() => setActiveChatId(chat._id)}
              >
                <strong>{partner?.username || "Unknown user"}</strong>
                <small>{chat.lastMessage?.content || "No messages yet"}</small>
              </button>
            );
          })}
        </aside>

        <div className="content-panel chat-thread-panel">
          <h3>Messages</h3>

          <div className="chat-thread">
            {messages.map((message) => {
              const mine = getId(message.senderId) === selfId;
              return (
                <article key={message._id} className={`chat-msg ${mine ? "mine" : "theirs"}`}>
                  <p>{message.content}</p>
                  <small>{formatRelativeTime(message.createdAt)}</small>
                </article>
              );
            })}
          </div>

          {typingState.isTyping ? <p className="muted">Other user is typing...</p> : null}

          <form className="chat-input" onSubmit={handleSendMessage}>
            <textarea
              rows={3}
              placeholder="Type a message"
              value={draft}
              onChange={(event) => handleTyping(event.target.value)}
            />
            <button type="submit" className="btn btn--primary" disabled={!activeChatId}>
              Send
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}

export default ChatPage;
