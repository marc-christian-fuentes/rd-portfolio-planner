/**
 * COMMENTS (spec section 11)
 * --------------------------
 * A thread attached to any item (project, sales plan, hire, plan entry),
 * with replies and @mentions. Typing "@" suggests people; mentioned people
 * get a notification in their Inbox. No emails are sent.
 */
import { useRef, useState } from 'react';
import { personName } from '../data/model';
import type { Comment, CommentItemType } from '../data/types';
import { useApp } from '../store';

/** Shows "@Name" mentions in bold green. */
function CommentText({ text }: { text: string }) {
  const people = useApp((s) => s.data.people);
  const names = people.map((p) => p.name).sort((a, b) => b.length - a.length);
  const parts: (string | { mention: string })[] = [];
  let rest = text;
  while (rest.length) {
    const at = rest.indexOf('@');
    if (at === -1) {
      parts.push(rest);
      break;
    }
    const name = names.find((n) => rest.slice(at + 1, at + 1 + n.length).toLowerCase() === n.toLowerCase());
    if (!name) {
      parts.push(rest.slice(0, at + 1));
      rest = rest.slice(at + 1);
      continue;
    }
    parts.push(rest.slice(0, at), { mention: rest.slice(at, at + 1 + name.length) });
    rest = rest.slice(at + 1 + name.length);
  }
  return (
    <>
      {parts.map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : (
          <span key={i} className="font-semibold text-moss-700">
            {p.mention}
          </span>
        ),
      )}
    </>
  );
}

/** Text box with @mention suggestions. */
function CommentBox({ onSubmit, placeholder, autoFocus }: { onSubmit: (text: string) => void; placeholder: string; autoFocus?: boolean }) {
  const people = useApp((s) => s.data.people);
  const [text, setText] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  // The word being typed, if it starts with "@".
  const match = /@([\w’'-]*)$/.exec(text);
  const query = match ? match[1].toLowerCase() : null;
  const suggestions = query !== null ? people.filter((p) => p.name.toLowerCase().includes(query)).slice(0, 5) : [];

  const insert = (name: string) => {
    setText(text.replace(/@([\w’'-]*)$/, `@${name} `));
    ref.current?.focus();
  };

  return (
    <div className="relative">
      <textarea
        ref={ref}
        autoFocus={autoFocus}
        value={text}
        rows={2}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="block w-full rounded-md border border-moss-300 bg-white px-2 py-1.5 text-[13px] text-moss-900 focus:border-moss-600 focus:outline-none"
      />
      {suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 w-64 overflow-hidden rounded-md border border-moss-200 bg-white text-[13px] shadow-md" role="listbox" aria-label="Mention someone">
          {suggestions.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  insert(p.name);
                }}
                className="block w-full px-3 py-1.5 text-left hover:bg-sage-100"
              >
                {p.name} <span className="text-[12px] text-moss-500">· {p.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] text-moss-500">Type @ to mention someone. They’ll see it in their Inbox.</span>
        <button
          disabled={!text.trim()}
          onClick={() => {
            onSubmit(text.trim());
            setText('');
          }}
          className="rounded-md bg-moss-800 px-3 py-1 text-[12px] font-medium text-white hover:bg-moss-700 disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
}

function OneComment({ c, onReply }: { c: Comment; onReply?: () => void }) {
  const data = useApp((s) => s.data);
  return (
    <div>
      <div className="flex flex-wrap items-baseline gap-x-2 text-[12px]">
        <span className="font-semibold text-moss-900">{personName(data, c.authorId)}</span>
        <span className="num text-moss-500">{c.at}</span>
      </div>
      <p className="mt-0.5 text-[13px] text-moss-800">
        <CommentText text={c.text} />
      </p>
      {onReply && (
        <button onClick={onReply} className="mt-0.5 text-[12px] text-moss-500 hover:text-moss-900">
          Reply
        </button>
      )}
    </div>
  );
}

export function CommentThread({ itemType, itemId, title = 'Comments' }: { itemType: CommentItemType; itemId: string; title?: string }) {
  const { comments, addComment } = useApp();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const here = comments.filter((c) => c.itemType === itemType && c.itemId === itemId);
  const threads = here.filter((c) => c.parentId === null);

  return (
    <section aria-label={title}>
      <h3 className="mb-2 text-[13px] font-semibold text-moss-900">
        {title} <span className="num font-normal text-moss-500">· {here.length}</span>
      </h3>
      <div className="space-y-3">
        {threads.map((t) => (
          <div key={t.id} className="rounded-lg border border-moss-200 bg-white px-3 py-2.5">
            <OneComment c={t} onReply={() => setReplyTo(replyTo === t.id ? null : t.id)} />
            {here
              .filter((r) => r.parentId === t.id)
              .map((r) => (
                <div key={r.id} className="mt-2 ml-4 border-l-2 border-sage-200 pl-3">
                  <OneComment c={r} />
                </div>
              ))}
            {replyTo === t.id && (
              <div className="mt-2 ml-4">
                <CommentBox
                  autoFocus
                  placeholder="Write a reply"
                  onSubmit={(text) => {
                    addComment({ itemType, itemId, text, parentId: t.id });
                    setReplyTo(null);
                  }}
                />
              </div>
            )}
          </div>
        ))}
        <CommentBox placeholder="Add a comment" onSubmit={(text) => addComment({ itemType, itemId, text, parentId: null })} />
      </div>
    </section>
  );
}

/** A collapsed "Comments (n)" toggle that opens a thread, for tight spots like list rows and cards. */
export function CommentToggle({ itemType, itemId }: { itemType: CommentItemType; itemId: string }) {
  const count = useApp((s) => s.comments.filter((c) => c.itemType === itemType && c.itemId === itemId).length);
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="text-[12px] text-moss-600 hover:text-moss-900">
        {open ? 'Hide comments' : `Comments (${count})`}
      </button>
      {open && (
        <div className="mt-2">
          <CommentThread itemType={itemType} itemId={itemId} />
        </div>
      )}
    </div>
  );
}
