import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  Search,
  X,
  ShieldCheck,
  ShieldOff,
  Trash2,
  RefreshCw,
  Square,
  Monitor,
  Sun,
  Moon,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  Layers,
  ListChecks,
  ArrowDownAZ,
  ArrowDownZA,
  SquareCheck,
} from "lucide-react";
import { Button } from "../src/ui/components/ui/button";
import { Input } from "../src/ui/components/ui/input";
import { Select } from "../src/ui/components/ui/select";

const filterOptions = [
  { value: "all", label: "All chats", icon: Layers },
  { value: "selected", label: "Selected", icon: SquareCheck },
  { value: "protected", label: "Protected", icon: ShieldCheck },
  { value: "unprotected", label: "Unprotected", icon: ShieldOff },
];
const sortOptions = [
  { value: "sidebar", label: "Discovery order", icon: ListChecks },
  { value: "az", label: "Title A–Z", icon: ArrowDownAZ },
  { value: "za", label: "Title Z–A", icon: ArrowDownZA },
];
export const Theme = () => (
  <label className="theme-control">
    <Monitor />
    <span className="sr-only">Colour theme</span>
    <Select
      id="theme"
      aria-label="Colour theme"
      defaultValue="system"
      options={[
        { value: "system", label: "System", icon: Monitor },
        { value: "light", label: "Light", icon: Sun },
        { value: "dark", label: "Dark", icon: Moon },
      ]}
    />
  </label>
);
const brandIcon =
  "data:image/png;base64," +
  readFileSync("extension/assets/icon-128.png").toString("base64");
export const BrandIcon = () => (
  <img src={brandIcon} alt="" className="brand-icon" width="32" height="32" />
);
export function AboutDialog() {
  return (
    <dialog id="aboutDialog" aria-labelledby="aboutTitle">
      <div className="about-heading">
        <div className="brand-mark">
          <BrandIcon />
        </div>
        <h2 id="aboutTitle">About ChatSweeper</h2>
        <Button
          id="aboutClose"
          variant="outline"
          size="icon"
          aria-label="Close About"
        >
          <X />
        </Button>
      </div>
      <p className="about-tagline">Select. Manage. Keep or Sweep.</p>
      <p>
        Created by <strong>Mikaela Marie Punzalan</strong>
        <br />© 2026 Mikaela Marie Punzalan
      </p>
      <p>
        Free and open source under the{" "}
        <a
          href="https://www.gnu.org/licenses/gpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          GNU General Public License v3 (GPLv3)
        </a>
        .
      </p>
      <a
        className="about-source"
        href="https://github.com/okmikaelaok/chat-sweeper"
        target="_blank"
        rel="noopener noreferrer"
      >
        View source on GitHub
        <ExternalLink />
      </a>
      <div className="about-explanation">
        <h3>Keep chats with Protect</h3>
        <p>
          <strong>Protect</strong> saves your choice locally across reloads and
          prevents ChatSweeper from deleting the chat. Find protected chats with
          Show → Protected.
        </p>
        <p>
          Protecting a selected chat deselects it. Protection applies only to
          ChatSweeper; it does not prevent manual deletion on Gemini or ChatGPT.
        </p>
      </div>
    </dialog>
  );
}
function Shell({ site }: { site: string }) {
  return (
    <>
      <Button id="launch" className="launcher">
        <BrandIcon />
        ChatSweeper
      </Button>
      <section id="panel" hidden aria-label={`ChatSweeper for ${site}`}>
        <header className="panel-header">
          <div className="brand-row">
            <div className="brand-mark">
              <BrandIcon />
            </div>
            <div>
              <h1>ChatSweeper</h1>
              <p className="tagline">Select. Manage. Keep or Sweep.</p>
            </div>
            <Button
              id="close"
              variant="outline"
              size="icon"
              aria-label="Close ChatSweeper"
            >
              <X />
            </Button>
          </div>
          <div className="provider-row">
            <div
              id="provider"
              aria-label={`${site} detected`}
              title={`${site} detected`}
            >
              <span className="provider-dot" aria-hidden="true" />
              {site}
            </div>
            <div className="header-tools">
              <Theme />
              <Button id="about" variant="outline">
                <Info />
                About
              </Button>
            </div>
          </div>
        </header>
        <div className="controls">
          <div className="search-wrap">
            <Search />
            <Input
              id="search"
              type="search"
              placeholder="Search chat titles"
              aria-label="Search chat titles"
            />
          </div>
          <div className="row">
            <label className="field">
              <span>Show</span>
              <Select id="filter" aria-label="Show" options={filterOptions} />
            </label>
            <label className="field">
              <span>Sort by</span>
              <Select id="sort" aria-label="Sort by" options={sortOptions} />
            </label>
          </div>
          <div className="scan-row">
            <Button id="scan" variant="outline">
              <RefreshCw />
              Load more chats
            </Button>
            <Button id="stop" variant="outline" disabled>
              <Square fill="currentColor" />
              Stop
            </Button>
          </div>
        </div>
        <div
          id="systemStatus"
          className="status-panel"
          role="group"
          aria-labelledby="statusLabel"
        >
          <div
            className="status-readout"
            role="status"
            aria-live="polite"
            aria-atomic="false"
          >
            <div className="status-heading">
              <strong id="statusLabel">Status:</strong>
              <p id="status" />
            </div>
            <dl className="status-counts">
              <div aria-atomic="true">
                <dt>Discovered</dt>
                <dd id="count">0</dd>
              </div>
              <div aria-atomic="true">
                <dt id="selectionMetricLabel">Selected</dt>
                <dd id="selection">0</dd>
              </div>
              <div aria-atomic="true">
                <dt>Protected</dt>
                <dd id="protectedCount">0</dd>
              </div>
            </dl>
          </div>
          <div id="selectionBar" className="status-actions">
            <div id="selectionControl">
              <label>
                <input
                  id="all"
                  type="checkbox"
                  aria-label="Select all unprotected chats on this page"
                  title="Select all unprotected chats on this page (up to 50)"
                />
                <span>Select all</span>
                <span className="selection-scope">on this page · max 50</span>
              </label>
            </div>
            <nav className="pagination" aria-label="Chat pages">
              <Button
                id="previousPage"
                variant="outline"
                size="icon"
                aria-label="Previous 50 chats"
              >
                <ChevronLeft />
              </Button>
              <span id="pageInfo" role="status" aria-live="polite">
                No chats
              </span>
              <Button
                id="nextPage"
                variant="outline"
                size="icon"
                aria-label="Next 50 chats"
              >
                <ChevronRight />
              </Button>
            </nav>
          </div>
        </div>
        <div id="list" aria-label="Chats" />
        <footer>
          <Button id="delete" variant="destructive" disabled>
            <Trash2 />
            <span id="deleteLabel">Delete selected chats</span>
          </Button>
        </footer>
      </section>
      <AboutDialog />
    </>
  );
}
export const shells = Object.fromEntries(
  ["Gemini", "ChatGPT"].map((site) => [
    site,
    renderToStaticMarkup(<Shell site={site} />),
  ]),
);
export const icons = Object.fromEntries(
  Object.entries({ shield: ShieldCheck }).map(([name, Icon]) => [
    name,
    renderToStaticMarkup(<Icon aria-hidden="true" />),
  ]),
);
