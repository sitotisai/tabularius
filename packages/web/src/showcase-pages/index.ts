import { accountTimelinePage } from './account-timeline.ts';
import { connectPage } from './connect.ts';
import { salesDashboardPage } from './sales-dashboard.ts';
import { pipelineBoardPage } from './pipeline-board.ts';
import { todayPage } from './today.ts';
import type { ShowcaseNames } from './shared.ts';

export type { ShowcaseNames } from './shared.ts';
export { DEFAULT_NAMES } from './shared.ts';

/** The showcase's HTML pages, in the order the Home folder lists them: the layout's name and the page it shows. */
export const SHOWCASE_PAGES: { name: string; html: (names?: Partial<ShowcaseNames>) => string }[] = [
  { name: 'Today', html: todayPage },
  { name: 'Sales dashboard', html: salesDashboardPage },
  { name: 'Account timeline', html: accountTimelinePage },
  { name: 'Pipeline board', html: () => pipelineBoardPage() },
  { name: 'Connect', html: connectPage },
];

export { accountTimelinePage, connectPage, salesDashboardPage, todayPage };
