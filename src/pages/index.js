/**
 * Pages Registry - Maps view states to page components
 * This makes it easy to organize and understand the page structure
 * without having massive render functions in App.jsx
 * 
 * Import all pages here and export a registry for dynamic rendering
 */

import MenuPage from './MenuPage';
import QuickSetupPage from './QuickSetupPage';
import TournSetupPage from './TournSetupPage';
import TournDraftPage from './TournDraftPage';
import TournHubPage from './TournHubPage';
import OnlineEntryPage from './OnlineEntryPage';
import OnlineMenuPage from './OnlineMenuPage';

export const PAGE_REGISTRY = {
  menu: MenuPage,
  quick_setup: QuickSetupPage,
  tourn_setup: TournSetupPage,
  tourn_draft: TournDraftPage,
  tourn_hub: TournHubPage,
  online_entry: OnlineEntryPage,
  online_menu: OnlineMenuPage,
  // Note: 'match' and 'auction' are handled separately in App.jsx
  // as they use MatchCenter and AuctionRoom components
};

/**
 * Get page component for a given view
 * Usage: const PageComponent = getPageComponent(view);
 *        return <PageComponent {...props} />;
 */
export const getPageComponent = (view) => {
  return PAGE_REGISTRY[view];
};

export default PAGE_REGISTRY;
