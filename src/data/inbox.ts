/**
 * INBOX (spec section 11)
 * -----------------------
 * Notifications only: mentions, replies to your comments, and approvals
 * waiting on you. The work itself (approving, replying) happens on the
 * item's own page; each notification links there.
 */
import { personName } from './model';
import { STAGE_INFO, nextStageAction } from './planning';
import { canDecide } from './resourcing';
import type { Comment, ProposedHire, QuarterlyPlan, Role, SeedData } from './types';

export interface InboxItem {
  id: string;
  kind: 'Mention' | 'Reply' | 'Approval';
  at: string;
  title: string;
  detail: string;
  link: string;
}

/** Where a comment's item lives in the app. */
function linkFor(c: Comment, data: SeedData, hires: ProposedHire[]): { link: string; where: string } {
  const name = (id: string) => data.projects.find((p) => p.id === id)?.name ?? id;
  switch (c.itemType) {
    case 'project':
      return { link: `/project/${c.itemId}`, where: name(c.itemId) };
    case 'revenue-plan':
      return { link: `/sales?project=${c.itemId}`, where: `${name(c.itemId)} sales plan` };
    case 'plan-entry':
      return { link: '/planning/prioritise', where: `${name(c.itemId)} in the quarterly plan` };
    case 'hire': {
      const hire = hires.find((h) => h.id === c.itemId);
      const project = data.projects.find((p) => p.id === hire?.projectId);
      return {
        link: project ? `/resourcing?pjm=${project.projectManagerId}&project=${project.id}` : '/resourcing',
        where: `hire for ${project?.name ?? 'a project'}`,
      };
    }
    default:
      return { link: '/', where: 'an item' };
  }
}

export function inboxFor(
  me: string,
  role: Role,
  s: { data: SeedData; comments: Comment[]; hires: ProposedHire[]; plan: QuarterlyPlan },
): InboxItem[] {
  const items: InboxItem[] = [];
  const short = (t: string) => (t.length > 140 ? `${t.slice(0, 140)}…` : t);

  for (const c of s.comments) {
    if (c.authorId === me) continue;
    const { link, where } = linkFor(c, s.data, s.hires);
    const parent = c.parentId ? s.comments.find((x) => x.id === c.parentId) : undefined;
    if (c.mentions.includes(me)) {
      items.push({ id: `c-${c.id}`, kind: 'Mention', at: c.at, title: `${personName(s.data, c.authorId)} mentioned you on ${where}`, detail: short(c.text), link });
    } else if (parent?.authorId === me) {
      items.push({ id: `r-${c.id}`, kind: 'Reply', at: c.at, title: `${personName(s.data, c.authorId)} replied on ${where}`, detail: short(c.text), link });
    }
  }

  for (const h of s.hires) {
    if (!canDecide(role, h.status)) continue;
    const project = s.data.projects.find((p) => p.id === h.projectId);
    const dept = s.data.departments.find((d) => d.id === h.departmentId);
    items.push({
      id: `h-${h.id}-${h.status}`,
      kind: 'Approval',
      at: h.history[h.history.length - 1]?.at ?? '',
      title: `Hire waiting for you: ${dept?.name ?? ''} for ${project?.name ?? ''}`,
      detail: `${h.hours.toLocaleString('en-US')} hrs/yr from ${h.startDate}. ${h.status}.`,
      link: project ? `/resourcing?pjm=${project.projectManagerId}&project=${project.id}` : '/resourcing',
    });
  }

  if (role === 'Leadership') {
    for (const p of s.plan.pullIns.filter((x) => x.status === 'Pending')) {
      items.push({
        id: `p-${p.id}`,
        kind: 'Approval',
        at: p.at,
        title: `Pull-in waiting for you: ${s.data.projects.find((x) => x.id === p.projectId)?.name ?? ''}`,
        detail: `“${short(p.reason)}” · ${personName(s.data, p.proposedBy)}`,
        link: '/planning/prioritise',
      });
    }
  }

  const action = nextStageAction(role, s.plan.stage);
  if (action) {
    items.push({
      id: `s-${s.plan.quarter}-${s.plan.stage}`,
      kind: 'Approval',
      at: s.plan.history[s.plan.history.length - 1]?.at ?? '',
      title: `${s.plan.quarter} plan is at ${STAGE_INFO[s.plan.stage].title}: your move`,
      detail: `Next step: ${action.label.toLowerCase()}.`,
      link: s.plan.stage === 'Propose' ? '/planning/submit' : '/planning/prioritise',
    });
  }

  return items.sort((a, b) => b.at.localeCompare(a.at));
}
