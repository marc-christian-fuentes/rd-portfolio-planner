/**
 * INBOX (spec section 11)
 * -----------------------
 * Mentions, replies and approvals for the person you're viewing as.
 * Notifications only: each one links to the item, where the work happens.
 */
import { Link } from 'react-router-dom';
import { personName } from '../data/model';
import { useApp, useInbox } from '../store';
import { PageHeader, Tabs } from '../components/ui';
import { useQueryParam } from '../components/Filters';

type Filter = 'all' | 'Mention' | 'Reply' | 'Approval';

const KIND_STYLE: Record<string, string> = {
  Mention: 'bg-sage-200 text-moss-800',
  Reply: 'bg-moss-100 text-moss-700',
  Approval: 'border border-ochre/60 text-ochre',
};

export default function InboxPage() {
  const { data, actingAsId, markInboxSeen } = useApp();
  const { items, unread, isUnread } = useInbox();
  const [filter, setFilter] = useQueryParam('show', 'all');
  const shown = filter === 'all' ? items : items.filter((i) => i.kind === filter);
  const count = (k: Filter) => (k === 'all' ? items.length : items.filter((i) => i.kind === k).length);

  return (
    <>
      <PageHeader
        title="Inbox"
        subtitle={`Mentions, replies and approvals for ${personName(data, actingAsId)}. Notifications only: open an item to act on it. No emails are sent.`}
        aside={
          unread.length > 0 && (
            <button onClick={() => markInboxSeen(unread.map((i) => i.id))} className="text-[13px] text-moss-600 underline hover:text-moss-900">
              Mark all as read
            </button>
          )
        }
      />

      <div className="overflow-hidden rounded-[10px] border border-moss-200 bg-white">
        <Tabs<Filter>
          label="Show"
          active={filter as Filter}
          onChange={setFilter}
          tabs={[
            { id: 'all', label: 'All', count: count('all') },
            { id: 'Mention', label: 'Mentions', count: count('Mention') },
            { id: 'Reply', label: 'Replies', count: count('Reply') },
            { id: 'Approval', label: 'Approvals', count: count('Approval') },
          ]}
        />
        {shown.length === 0 ? (
          <p className="px-4 py-6 text-[13px] text-moss-500">Nothing here. Try another person from the menu at the top, such as Tom Okafor (Leadership).</p>
        ) : (
          <ul>
            {shown.map((i) => {
              const fresh = isUnread(i.id);
              return (
                <li key={i.id} className="border-t border-moss-100 first:border-t-0">
                  <Link
                    to={i.link}
                    onClick={() => markInboxSeen([i.id])}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-moss-50 ${fresh ? 'bg-sage-50' : ''}`}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${fresh ? 'bg-moss-600' : 'bg-transparent'}`} aria-label={fresh ? 'Unread' : undefined} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-px text-[11px] font-medium ${KIND_STYLE[i.kind]}`}>{i.kind}</span>
                        <span className={`text-[13px] ${fresh ? 'font-semibold' : 'font-medium'} text-moss-900`}>{i.title}</span>
                      </div>
                      <p className="mt-0.5 text-[13px] text-moss-600">{i.detail}</p>
                    </div>
                    <span className="num shrink-0 text-[12px] text-moss-500">{i.at}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
