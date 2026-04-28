import { useEffect, useMemo, useRef, useState } from "react";
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
import { listUsers } from "../features/profile/profileApi";
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
  const [participantSearch, setParticipantSearch] = useState("");
  const [activeChatId, setActiveChatId] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingState, setTypingState] = useState({ isTyping: false, userId: "" });
  const hasAutoStartedRef = useRef(false);
  const threadRef = useRef(null);

  const selfId = user?.id || user?._id || "";

  const chatsQuery = useQuery({
    queryKey: ["chats"],
    queryFn: () => listChats({ page: 1, limit: 30 }),
  });

  const chatItems = chatsQuery.data?.items || [];

  const usersQuery = useQuery({
    queryKey: ["users", "chat-search", participantSearch],
    queryFn: () => listUsers({ search: participantSearch, page: 1, limit: 8 }),
    enabled: participantSearch.trim().length >= 2,
  });

  const searchableUsers = usersQuery.data?.items || [];

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

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, activeChatId]);

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

  useEffect(() => {
    if (!initialParticipant || hasAutoStartedRef.current) return;
    hasAutoStartedRef.current = true;
    startChatMutation.mutate(initialParticipant);
  }, [initialParticipant, startChatMutation]);

  const sendFallbackMutation = useMutation({
    mutationFn: ({ chatId, content }) => sendChatMessage(chatId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-messages", activeChatId] });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });

  const socket = useMemo(() => getSocket(token), [token]);
  const activeChat = useMemo(
    () => chatItems.find((chat) => chat._id === activeChatId) || null,
    [chatItems, activeChatId]
  );
  const activePartner = activeChat ? resolveOtherParticipant(activeChat, selfId) : null;

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
    <AppShell title="Realtime Chat" subtitle="1-to-1 messaging with live updates">
      <section className="content-panel chat-start-panel">
        <div className="chat-discovery">
          <form className="chat-discovery__start" onSubmit={handleStartChat}>
            <input
              value={participantId}
              onChange={(event) => setParticipantId(event.target.value)}
              placeholder="Enter user ID to start chat"
            />
            <button type="submit" className="btn btn--primary" disabled={startChatMutation.isPending}>
              {startChatMutation.isPending ? "Starting..." : "Start / Open Chat"}
            </button>
          </form>

          <input
            className="chat-discovery__search"
            value={participantSearch}
            onChange={(event) => setParticipantSearch(event.target.value)}
            placeholder="Search users by name or email (min 2 chars)"
          />

          {participantSearch.trim().length >= 2 ? (
            <div className="chat-user-search-results">
              {searchableUsers.length === 0 && !usersQuery.isLoading ? (
                <p className="muted">No users found.</p>
              ) : null}

              {searchableUsers.map((candidate) => (
                <button
                  key={candidate.id}
                  type="button"
                  className="chat-list-item chat-user-result"
                  onClick={() => {
                    setParticipantId(candidate.id);
                    startChatMutation.mutate(candidate.id);
                  }}
                >
                  <strong>{candidate.username}</strong>
                  <small>{candidate.email}</small>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="chat-layout">
        <aside className="content-panel chat-list-panel">
          <div className="chat-section-head">
            <h3>Your Chats</h3>
            <small>{chatItems.length}</small>
          </div>

          {chatsQuery.isLoading ? <p className="muted">Loading chats...</p> : null}
          {!chatsQuery.isLoading && chatItems.length === 0 ? (
            <p className="muted">No chats yet. Search and start one above.</p>
          ) : null}

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
          <div className="chat-section-head">
            <h3>{activePartner?.username || "Messages"}</h3>
            <small>{activePartner?.email || "Select or start a chat"}</small>
          </div>

          <div className="chat-thread" ref={threadRef}>
            {!activeChatId ? (
              <p className="muted">Start a chat to begin messaging.</p>
            ) : null}
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
              disabled={!activeChatId}
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
