import { useMemo, useState } from "react";
import { Paperclip, Pin, Plus, Settings2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { useLocation } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import Modal from "../components/Modal";
import { useAppData } from "../hooks/useAppData";
import type { Channel, ChannelInput, Message, MessageAttachment, MessageInput } from "../types/models";
import { formatDateTime } from "../services/dateFormatting";
import "./messages.css";

const MAX_ATTACHMENT_BYTES = 1_000_000;
const MAX_ATTACHMENTS = 3;

const markdownComponents: Components = {
  a: ({ href, children, ...props }) => href?.startsWith("#mention-")
    ? <span className="chat-mention">{children}</span>
    : <a href={href} target="_blank" rel="noreferrer" {...props}>{children}</a>,
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function markdownWithMentions(message: Message, accounts: { id: string; fullName: string }[]) {
  return [...(message.mentions ?? [])]
    .map((id) => accounts.find((account) => account.id === id))
    .filter((account): account is { id: string; fullName: string } => Boolean(account))
    .sort((first, second) => second.fullName.length - first.fullName.length)
    .reduce((content, account) => content.replace(
      new RegExp(`@${escapeRegExp(account.fullName)}(?![\\w])`, "g"),
      `[@${account.fullName}](#mention-${account.id})`,
    ), message.content);
}

function readAttachment(file: File) {
  return new Promise<MessageAttachment>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error(`Unable to read ${file.name}.`));
        return;
      }
      resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, dataUrl: reader.result });
    };
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

interface Conversation {
  id: string;
  type: "channel" | "direct";
  title: string;
  subtitle: string;
  participantId?: string;
  legacyParticipantId?: string;
  channel?: Channel;
}

function directConversationId(firstId: string, secondId: string) {
  return `direct-${[firstId, secondId].sort().join(":")}`;
}

function getInitials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

function isUnreadForAccount(message: Message, accountId?: string) {
  return message.readBy ? !message.readBy.includes(accountId ?? "") : !message.read;
}

function Messages() {
  const location = useLocation();
  const {
    accounts,
    currentAccount,
    contacts,
    channels,
    messages,
    settings,
    addChannel,
    updateChannel,
    deleteChannel,
    addMessage,
    updateMessage,
  } = useAppData();
  const initialRecipientId = (location.state as { recipientId?: string } | null)?.recipientId;
  const [activeConversationId, setActiveConversationId] = useState(() => initialRecipientId ? `direct-${initialRecipientId}` : "channel-general");
  const [searchTerm, setSearchTerm] = useState("");
  const [draft, setDraft] = useState("");
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [channelDialog, setChannelDialog] = useState<"create" | "manage" | null>(null);
  const [channelDraft, setChannelDraft] = useState<ChannelInput>({ name: "", description: "", ownerId: "", memberIds: [], isPrivate: false });
  const [channelError, setChannelError] = useState("");
  const [channelToDelete, setChannelToDelete] = useState<Channel | null>(null);

  const conversations = useMemo<Conversation[]>(() => {
    const peers = new Map<string, Conversation>();
    const currentEmail = currentAccount?.email.toLowerCase();

    contacts.forEach((contact) => {
      if (contact.email.toLowerCase() === currentEmail) return;
      if (contact.status !== "active" && !messages.some((message) => message.recipientId === contact.id)) return;
      const matchingAccount = accounts.find((account) => account.email.toLowerCase() === contact.email.toLowerCase());
      const participantId = matchingAccount?.id ?? contact.id;
      peers.set(contact.email.toLowerCase(), {
        id: currentAccount ? directConversationId(currentAccount.id, participantId) : `direct-${participantId}`,
        type: "direct",
        title: contact.name,
        subtitle: contact.department || contact.role,
        participantId,
        legacyParticipantId: contact.id,
      });
    });

    accounts.forEach((account) => {
      const email = account.email.toLowerCase();
      if (account.id === currentAccount?.id || peers.has(email)) return;
      peers.set(email, {
        id: currentAccount ? directConversationId(currentAccount.id, account.id) : `direct-${account.id}`,
        type: "direct",
        title: account.fullName,
        subtitle: account.role,
        participantId: account.id,
      });
    });

    const directConversations = [...peers.values()].sort((first, second) => first.title.localeCompare(second.title));
    return [
      ...channels.map((channel) => ({
        id: channel.id,
        type: "channel" as const,
        title: channel.name,
        subtitle: channel.description || (channel.isPrivate ? "Private channel" : "Public channel"),
        channel,
      })),
      ...directConversations,
    ];
  }, [accounts, channels, contacts, currentAccount, messages]);

  const messagesForConversation = (conversation: Conversation) => messages.filter((message) => {
    if (conversation.type === "channel") {
      return message.conversationType === "channel" && message.conversationId === conversation.id;
    }
    return message.conversationType !== "channel" && (
      message.conversationId === conversation.id
      || message.recipientId === conversation.legacyParticipantId
      || (!message.conversationId && message.recipientId === conversation.participantId)
    );
  });

  const canCreateChannel = currentAccount?.role === "Administrator" || currentAccount?.role === "Channel Owner";
  const accessibleConversations = conversations.filter((conversation) => {
    const channel = conversation.channel;
    if (!channel?.isPrivate || currentAccount?.role === "Administrator") return true;
    return channel.ownerId === currentAccount?.id || Boolean(currentAccount && channel.memberIds.includes(currentAccount.id));
  });
  const requestedConversation = accessibleConversations.find((conversation) =>
    conversation.participantId === initialRecipientId || conversation.legacyParticipantId === initialRecipientId,
  );
  const activeConversation = accessibleConversations.find((conversation) => conversation.id === activeConversationId)
    ?? requestedConversation
    ?? accessibleConversations[0];
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleConversations = accessibleConversations.filter((conversation) => {
    if (!normalizedSearch) return true;
    if (`${conversation.title} ${conversation.subtitle}`.toLowerCase().includes(normalizedSearch)) return true;
    return messagesForConversation(conversation).some((message) =>
      `${message.senderName} ${message.subject} ${message.content} ${(message.attachments ?? []).map((attachment) => attachment.name).join(" ")}`.toLowerCase().includes(normalizedSearch),
    );
  });
  const conversationMessages = activeConversation
    ? messagesForConversation(activeConversation)
      .filter((message) => !normalizedSearch
        || `${message.senderName} ${message.subject} ${message.content}`.toLowerCase().includes(normalizedSearch)
        || `${activeConversation.title} ${activeConversation.subtitle}`.toLowerCase().includes(normalizedSearch))
      .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
    : [];
  const totalUnread = messages.filter((message) => isUnreadForAccount(message, currentAccount?.id) && message.folder !== "archived").length;
  const mentionCount = messages.filter((message) => isUnreadForAccount(message, currentAccount?.id) && message.mentions?.includes(currentAccount?.id ?? "")).length;
  const activeChannel = activeConversation?.channel;
  const canManageActiveChannel = Boolean(activeChannel && currentAccount && (
    currentAccount.role === "Administrator" || activeChannel.ownerId === currentAccount.id
  ));
  const pinnedMessages = activeChannel?.pinnedMessageIds
    .map((messageId) => messages.find((message) => message.id === messageId))
    .filter((message): message is Message => Boolean(message)) ?? [];
  const mentionToken = /(?:^|\s)@([\w.-]*)$/.exec(draft);
  const mentionSuggestions = mentionToken
    ? accounts.filter((account) => account.id !== currentAccount?.id && account.fullName.toLowerCase().startsWith(mentionToken[1].toLowerCase())).slice(0, 5)
    : [];

  const selectConversation = (conversation: Conversation) => {
    setActiveConversationId(conversation.id);
    messagesForConversation(conversation)
      .filter((message) => isUnreadForAccount(message, currentAccount?.id))
      .forEach((message) => updateMessage(message.id, {
        read: true,
        readBy: [...new Set([...(message.readBy ?? []), currentAccount?.id ?? ""])].filter(Boolean),
      }));
  };

  const openChannelDialog = (mode: "create" | "manage") => {
    setChannelError("");
    if (mode === "manage" && activeChannel) {
      setChannelDraft({
        name: activeChannel.name,
        description: activeChannel.description,
        ownerId: activeChannel.ownerId || currentAccount?.id || "",
        memberIds: activeChannel.memberIds.length ? activeChannel.memberIds : currentAccount ? [currentAccount.id] : [],
        isPrivate: activeChannel.isPrivate,
      });
    } else {
      setChannelDraft({ name: "", description: "", ownerId: currentAccount?.id ?? "", memberIds: currentAccount ? [currentAccount.id] : [], isPrivate: false });
    }
    setChannelDialog(mode);
  };

  const saveChannel = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = channelDraft.name.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-|-$/g, "");
    if (!name || !currentAccount) return;
    if (channels.some((channel) => channel.name === name && channel.id !== activeChannel?.id)) {
      setChannelError("A channel with that name already exists.");
      return;
    }

    if (channelDialog === "manage" && activeChannel) {
      updateChannel(activeChannel.id, {
        name,
        description: channelDraft.description.trim(),
        ownerId: currentAccount.role === "Administrator" ? channelDraft.ownerId : activeChannel.ownerId,
        isPrivate: channelDraft.isPrivate,
        memberIds: [...new Set([...channelDraft.memberIds, currentAccount.role === "Administrator" ? channelDraft.ownerId : activeChannel.ownerId])],
      });
    } else {
      const channel = addChannel({
        ...channelDraft,
        name,
        description: channelDraft.description.trim(),
        ownerId: currentAccount.id,
        memberIds: [...new Set([...channelDraft.memberIds, currentAccount.id])],
      });
      setActiveConversationId(channel.id);
    }
    setAttachmentError("");
    setChannelError("");
    setChannelDialog(null);
  };

  const togglePinnedMessage = (messageId: string) => {
    if (!activeChannel || !canManageActiveChannel) return;
    const isPinned = activeChannel.pinnedMessageIds.includes(messageId);
    updateChannel(activeChannel.id, {
      pinnedMessageIds: isPinned
        ? activeChannel.pinnedMessageIds.filter((pinnedId) => pinnedId !== messageId)
        : [...activeChannel.pinnedMessageIds, messageId],
    });
  };

  const handleAttachments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (!files.length) return;
    const accepted = files.every((file) => file.type.startsWith("image/") || file.type === "application/pdf" || file.type.startsWith("text/") || /\.(md|json|js|jsx|ts|tsx|css|html|py)$/i.test(file.name));
    const totalBytes = [...attachments, ...files.map((file) => ({ size: file.size }))].reduce((total, file) => total + file.size, 0);
    if (!accepted) {
      setAttachmentError("Attach images, PDFs, or text/code files.");
      return;
    }
    if (attachments.length + files.length > MAX_ATTACHMENTS || totalBytes > MAX_ATTACHMENT_BYTES) {
      setAttachmentError("Keep attachments to 3 files and 1 MB total per message.");
      return;
    }
    try {
      const nextAttachments = await Promise.all(files.map(readAttachment));
      setAttachments((current) => [...current, ...nextAttachments]);
      setAttachmentError("");
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "Unable to read that attachment.");
    }
  };

  const addMention = (fullName: string) => {
    const precedingText = draft.replace(/(?:^|\s)@[\w.-]*$/, "");
    setDraft(`${precedingText}${precedingText ? " " : ""}@${fullName} `);
  };

  const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = draft.trim();
    if ((!content && attachments.length === 0) || !activeConversation) return;
    const isChannel = activeConversation.type === "channel";
    const input: MessageInput = {
      recipientId: isChannel ? activeConversation.id : activeConversation.participantId ?? "",
      conversationId: isChannel ? activeConversation.id : activeConversation.participantId ?? "",
      conversationType: activeConversation.type,
      subject: isChannel ? `#${activeConversation.title}` : "",
      content,
      mentions: accounts.filter((account) => account.id !== currentAccount?.id && content.includes(`@${account.fullName}`)).map((account) => account.id),
      attachments,
    };
    addMessage(input);
    setDraft("");
    setAttachments([]);
    setAttachmentError("");
  };

  return (
    <div className="messages-page chat-page">
      <div className="page-heading"><div><h1>Team chat</h1><p>Keep team conversations organized and easy to find.</p></div><span className="chat-unread-count">{mentionCount > 0 ? `${mentionCount} mentions` : totalUnread ? `${totalUnread} unread` : "All caught up"}</span></div>
      <section className="chat-workspace" aria-label="Team conversations">
        <aside className="chat-sidebar">
          <label className="chat-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="Search people and messages" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></label>
          <div className="chat-conversation-groups">
            <section className="chat-conversation-group" aria-labelledby="channels-heading">
              <div className="chat-group-heading"><h2 id="channels-heading">Channels</h2>{canCreateChannel && <button className="chat-icon-button" type="button" title="Create channel" aria-label="Create channel" onClick={() => openChannelDialog("create")}><Plus size={16} /></button>}</div>
              {visibleConversations.filter((conversation) => conversation.type === "channel").map((conversation) => {
                const unread = messagesForConversation(conversation).filter((message) => isUnreadForAccount(message, currentAccount?.id)).length;
                return <button className={`chat-conversation${activeConversationId === conversation.id ? " active" : ""}`} type="button" key={conversation.id} onClick={() => selectConversation(conversation)}><span className="chat-channel-icon">{conversation.channel?.isPrivate ? "◈" : "#"}</span><span className="chat-conversation-label">{conversation.title}</span>{unread > 0 && <span className="chat-unread-pill">{unread}</span>}</button>;
              })}
            </section>
            <section className="chat-conversation-group" aria-labelledby="people-heading">
              <h2 id="people-heading">Direct messages</h2>
              {visibleConversations.filter((conversation) => conversation.type === "direct").map((conversation) => {
                const unread = messagesForConversation(conversation).filter((message) => isUnreadForAccount(message, currentAccount?.id)).length;
                return <button className={`chat-conversation${activeConversationId === conversation.id ? " active" : ""}`} type="button" key={conversation.id} onClick={() => selectConversation(conversation)}><span className="chat-person-avatar">{getInitials(conversation.title)}</span><span className="chat-conversation-label">{conversation.title}</span>{unread > 0 && <span className="chat-unread-pill">{unread}</span>}</button>;
              })}
              {visibleConversations.every((conversation) => conversation.type !== "direct") && <p className="chat-no-people">No matching people</p>}
            </section>
          </div>
          <div className="chat-sync-note"><span className="chat-sync-indicator" /> This browser only</div>
        </aside>
        {activeConversation ? <div className="chat-thread">
          <header className="chat-thread-header">
            <span className={activeConversation.type === "channel" ? "chat-thread-mark channel" : "chat-thread-mark"}>{activeConversation.type === "channel" ? "#" : getInitials(activeConversation.title)}</span>
            <div><h2>{activeConversation.type === "channel" ? `# ${activeConversation.title}` : activeConversation.title}</h2><p>{activeChannel ? `${activeChannel.isPrivate ? activeChannel.memberIds.length : accounts.length} members · ${activeChannel.isPrivate ? "Private" : "Public"}` : activeConversation.subtitle}</p></div>
            {normalizedSearch && <span className="chat-search-count">{conversationMessages.length} result{conversationMessages.length === 1 ? "" : "s"}</span>}
            {canManageActiveChannel && <button className="chat-icon-button chat-manage-channel" type="button" title="Manage channel" aria-label="Manage channel" onClick={() => openChannelDialog("manage")}><Settings2 size={17} /></button>}
          </header>
          {pinnedMessages.length > 0 && <details className="chat-pinned-panel"><summary><Pin size={14} /> Pinned for this channel <span>{pinnedMessages.length}</span></summary><div>{pinnedMessages.map((message) => <article key={message.id}><strong>{message.senderName}</strong><p>{message.content}</p></article>)}</div></details>}
          <div className="chat-message-list" aria-live="polite">
            {conversationMessages.length ? conversationMessages.map((message) => {
              const isMine = message.senderId
                ? message.senderId === currentAccount?.id
                : message.senderName === (currentAccount?.fullName ?? settings.profile.fullName);
              const isPinned = activeChannel?.pinnedMessageIds.includes(message.id) ?? false;
              return <article className={`chat-message${isMine ? " mine" : ""}`} key={message.id}>
                <div className="chat-message-avatar">{getInitials(message.senderName)}</div>
                <div className="chat-message-body">
                  <div className="chat-message-meta"><strong>{message.senderName}</strong><time dateTime={message.createdAt}>{formatDateTime(message.createdAt, settings.system)}</time>{message.mentions?.includes(currentAccount?.id ?? "") && <span className="chat-mentioned-badge">Mentioned you</span>}{canManageActiveChannel && <button className={`chat-pin-button${isPinned ? " pinned" : ""}`} type="button" title={isPinned ? "Unpin message" : "Pin message"} aria-label={isPinned ? "Unpin message" : "Pin message"} onClick={() => togglePinnedMessage(message.id)}><Pin size={13} fill={isPinned ? "currentColor" : "none"} /></button>}</div>
                  {message.subject && !message.subject.startsWith("#") && <strong className="chat-message-subject">{message.subject}</strong>}
                  <div className="chat-markdown"><ReactMarkdown components={markdownComponents}>{markdownWithMentions(message, accounts)}</ReactMarkdown></div>
                  {message.attachments && message.attachments.length > 0 && <div className="chat-attachments">{message.attachments.map((attachment) => attachment.type.startsWith("image/") ? <a className="chat-image-attachment" key={`${message.id}-${attachment.name}`} href={attachment.dataUrl} target="_blank" rel="noreferrer"><img src={attachment.dataUrl} alt={attachment.name} /><span>{attachment.name}</span></a> : <a className="chat-file-attachment" key={`${message.id}-${attachment.name}`} href={attachment.dataUrl} download={attachment.name}><Paperclip size={14} /><span>{attachment.name}</span><small>{Math.max(1, Math.round(attachment.size / 1024))} KB</small></a>)}</div>}
                </div>
              </article>;
            }) : <div className="chat-empty"><span>{activeConversation.type === "channel" ? "#" : getInitials(activeConversation.title)}</span><h3>{normalizedSearch ? "No matching messages" : `Start the conversation`}</h3><p>{normalizedSearch ? "Try another search or clear the search field." : `This is the beginning of ${activeConversation.type === "channel" ? `#${activeConversation.title}` : `your conversation with ${activeConversation.title}`}.`}</p></div>}
          </div>
          <form className="chat-composer" onSubmit={submitMessage}>
            <label className="visually-hidden" htmlFor="chat-message-input">Write a message</label>
            <textarea id="chat-message-input" rows={2} placeholder={`Message ${activeConversation.type === "channel" ? `#${activeConversation.title}` : activeConversation.title}`} value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit(); } }} />
            {mentionSuggestions.length > 0 && <div className="chat-mention-suggestions" role="listbox" aria-label="Mention a teammate">{mentionSuggestions.map((account) => <button type="button" role="option" aria-selected="false" key={account.id} onClick={() => addMention(account.fullName)}><span className="chat-person-avatar">{getInitials(account.fullName)}</span>{account.fullName}</button>)}</div>}
            {attachments.length > 0 && <div className="chat-pending-attachments">{attachments.map((attachment) => <span key={attachment.name}><Paperclip size={12} />{attachment.name}<button type="button" aria-label={`Remove ${attachment.name}`} onClick={() => setAttachments((current) => current.filter((item) => item.name !== attachment.name))}>×</button></span>)}</div>}
            {attachmentError && <p className="chat-composer-error" role="alert">{attachmentError}</p>}
            <div className="chat-composer-footer"><span>Markdown supported · Enter to send · Shift + Enter for a new line</span><div><label className="chat-attach-button" title="Attach files" aria-label="Attach files"><Paperclip size={16} /><input type="file" multiple accept="image/*,.pdf,.txt,.md,.json,.js,.jsx,.ts,.tsx,.css,.html,.py" onChange={handleAttachments} /></label><button className="primary-button" type="submit" disabled={!draft.trim() && attachments.length === 0} aria-label="Send message">Send <span aria-hidden="true">↗</span></button></div></div>
          </form>
        </div> : <div className="chat-empty"><h3>No conversation selected</h3><p>Choose a channel or person to start.</p></div>}
      </section>
      {channelDialog && <Modal title={channelDialog === "create" ? "Create a channel" : `Manage #${activeChannel?.name ?? "channel"}`} onClose={() => setChannelDialog(null)}><form className="chat-channel-form" onSubmit={saveChannel}>
        {channelError && <div className="form-error" role="alert">{channelError}</div>}
        <label className="form-group">Channel name<input required maxLength={40} value={channelDraft.name} onChange={(event) => setChannelDraft((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. client-alpha" /></label>
        <label className="form-group">Purpose<input maxLength={120} value={channelDraft.description} onChange={(event) => setChannelDraft((current) => ({ ...current, description: event.target.value }))} placeholder="What is this channel for?" /></label>
        {channelDialog === "manage" && <>
          {currentAccount?.role === "Administrator" && <label className="form-group">Channel owner<select value={channelDraft.ownerId} onChange={(event) => setChannelDraft((current) => ({ ...current, ownerId: event.target.value }))}>{accounts.map((account) => <option key={account.id} value={account.id}>{account.fullName}</option>)}</select></label>}
          <fieldset className="chat-member-picker"><legend>Channel members</legend>{accounts.map((account) => <label key={account.id}><input type="checkbox" checked={channelDraft.memberIds.includes(account.id)} onChange={(event) => setChannelDraft((current) => ({ ...current, memberIds: event.target.checked ? [...current.memberIds, account.id] : current.memberIds.filter((id) => id !== account.id) }))} />{account.fullName}<small>{account.role}</small></label>)}</fieldset>
        </>}
        <label className="chat-private-toggle"><input type="checkbox" checked={channelDraft.isPrivate} onChange={(event) => setChannelDraft((current) => ({ ...current, isPrivate: event.target.checked }))} /><span><strong>Private channel</strong><small>Only members and workspace admins can see it.</small></span></label>
        <div className="modal-actions">{channelDialog === "manage" && activeChannel && <button className="danger-text-button" type="button" onClick={() => { setChannelToDelete(activeChannel); setChannelDialog(null); }}>Delete channel</button>}<button className="secondary-button" type="button" onClick={() => setChannelDialog(null)}>Cancel</button><button className="primary-button" type="submit">{channelDialog === "create" ? "Create channel" : "Save changes"}</button></div>
      </form></Modal>}
      {channelToDelete && <ConfirmDialog title="Delete channel?" message={`#${channelToDelete.name}, its pins, and its messages will be removed from this browser.`} onClose={() => setChannelToDelete(null)} onConfirm={() => { deleteChannel(channelToDelete.id); setChannelToDelete(null); setActiveConversationId("channel-general"); }} />}
    </div>
  );
}

export default Messages;
