import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import {
  Search,
  X,
  ShieldCheck,
  Trash2,
  Moon,
  ExternalLink,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Info,
  Maximize2,
  Download,
} from "lucide-react";
import { Button } from "../src/ui/components/ui/button";
import { AboutDialog, BrandIcon, Theme } from "./render";

const { version } = JSON.parse(readFileSync("package.json", "utf8")) as {
  version: string;
};
const gallery = [
  {
    file: "search-title.png",
    caption: "Search",
    alt: "ChatSweeper searching chat titles and showing matching selected chats on ChatGPT",
  },
  {
    file: "chatgpt-chatsweeper-deleting.png",
    caption: "ChatGPT",
    alt: "ChatSweeper showing deleted, deleting and protected chats on ChatGPT",
  },
  {
    file: "gemini-chatsweeper-deleting.png",
    caption: "Gemini",
    alt: "ChatSweeper showing deletion progress and protected chats on Gemini",
  },
  {
    file: "show-filter.png",
    caption: "Show filters",
    alt: "ChatSweeper Show dropdown for filtering chats",
  },
  {
    file: "sortby-filter.png",
    caption: "Sort by",
    alt: "ChatSweeper Sort by dropdown with discovery order and title sorting",
  },
  {
    file: "no-matching-chats.png",
    caption: "No matches",
    alt: "ChatSweeper showing no matching chats for the current search or filter",
  },
];

function Start() {
  return (
    <main className="welcome">
      <header className="welcome-top">
        <a
          className="wordmark"
          href="https://github.com/okmikaelaok/chat-sweeper"
          target="_blank"
          rel="noreferrer"
        >
          <BrandIcon />
          ChatSweeper
        </a>
        <ul className="welcome-pills" aria-label="Project and privacy details">
          <li>
            <a
              href="https://github.com/okmikaelaok/chat-sweeper"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open source
              <ExternalLink />
            </a>
          </li>
          <li>
            <a href="LICENSE" target="_blank" rel="noopener noreferrer">
              GPLv3
              <ExternalLink />
            </a>
          </li>
          <li>No private API calls</li>
          <li title="No ChatSweeper account is needed. Sign in to ChatGPT or Gemini as usual.">
            No login required
          </li>
          <li title="No analytics or remote data collection. Protected chat IDs and theme preferences stay in local extension storage.">
            No data collection
          </li>
          <li>Chats remain in ChatGPT and Gemini</li>
        </ul>
        <div className="welcome-tools">
          <Theme />
          <Button id="about" variant="outline">
            <Info />
            About
          </Button>
        </div>
      </header>

      <section className="welcome-body" aria-labelledby="welcomeTitle">
        <div className="welcome-hero">
          <div className="welcome-intro">
            <img
              className="welcome-icon"
              src="assets/chat-sweeper-icon.png"
              alt="ChatSweeper"
              width="128"
              height="128"
            />
            <p className="welcome-subtitle">Select. Manage. Keep or Sweep.</p>
            <h1 id="welcomeTitle">Select and manage your chat space.</h1>
            <p className="welcome-description">
              Open a site to search, protect and clear your chats.
            </p>
            <div className="welcome-download">
              <span className="welcome-version">v{version}</span>
              <a
                className="welcome-download-button"
                href="https://github.com/okmikaelaok/chat-sweeper/releases/latest"
              >
                <Download />
                Download now
              </a>
            </div>
            <p className="welcome-download-note">
              Extract the ZIP, then choose Load unpacked in chrome://extensions.
            </p>
            <div className="site-cards">
              {[
                {
                  site: "ChatGPT",
                  url: "https://chatgpt.com/",
                  description: "Make room for your next idea.",
                },
                {
                  site: "Gemini",
                  url: "https://gemini.google.com/app",
                  description: "Give your chat history a fresh start.",
                },
              ].map(({ site, url, description }) => (
                <a
                  className="site-card"
                  href={url}
                  key={site}
                  aria-label={`Open ${site}`}
                >
                  <div className="site-card-top">
                    <span className="site-card-icon">
                      <MessageSquare />
                    </span>
                    <ExternalLink className="site-card-arrow" />
                  </div>
                  <h2>{site}</h2>
                  <p>{description}</p>
                  <span className="site-card-action">
                    Open {site}
                    <ChevronRight />
                  </span>
                </a>
              ))}
            </div>
            <p className="welcome-instruction">
              Once you're there, open the sidebar and click the{" "}
              <strong>ChatSweeper</strong> corner button.
            </p>
            <div className="feature-strip">
              <span>
                <Search />
                Search and filter
              </span>
              <span>
                <ShieldCheck />
                Protect chats
              </span>
              <span>
                <Trash2 />
                Delete selected chats
              </span>
            </div>
          </div>
          <div className="welcome-panel-hero">
            <span className="welcome-panel-badge">
              <Moon />
              Dark Mode
            </span>
            <a
              className="welcome-panel-preview"
              href="assets/previews/closeup-deleting.png"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View the ChatSweeper deletion close-up full size"
            >
              <img
                src="assets/previews/closeup-deleting.png"
                alt="Close-up of ChatSweeper deleting chats on Gemini, with deleted and protected states visible"
                width="536"
                height="1108"
                decoding="async"
              />
            </a>
          </div>
        </div>
      </section>
      <section
        className="welcome-gallery"
        aria-labelledby="galleryTitle"
        aria-roledescription="carousel"
      >
        <h2 id="galleryTitle" className="sr-only">
          ChatSweeper in action
        </h2>
        <div
          id="screenshotCarousel"
          className="carousel-stage"
          tabIndex={0}
          aria-label="Screenshots. Use left and right arrow keys to browse."
        >
          {gallery.map(({ file, caption, alt }, index) => (
            <button
              type="button"
              className="carousel-slide"
              key={file}
              data-caption={caption}
              data-position={
                index === 1
                  ? "current"
                  : index === 0
                    ? "previous"
                    : index === 2
                      ? "next"
                      : "hidden"
              }
              hidden={index > 2}
              aria-label={`${index === 1 ? "Expand" : "Show"} ${caption} screenshot`}
              aria-current={index === 1 ? "true" : undefined}
            >
              <img
                src={`assets/previews/${file}`}
                alt={alt}
                width="1920"
                height="1200"
                decoding="async"
              />
            </button>
          ))}
        </div>
        <div className="carousel-controls">
          <Button
            id="carouselPrevious"
            variant="outline"
            size="icon"
            aria-label="Previous screenshot"
          >
            <ChevronLeft />
          </Button>
          <p id="carouselCaption" aria-live="polite" aria-atomic="true">
            {gallery[1].caption} · 2 of {gallery.length}
          </p>
          <Button
            id="carouselNext"
            variant="outline"
            size="icon"
            aria-label="Next screenshot"
          >
            <ChevronRight />
          </Button>
          <Button id="carouselExpand" variant="outline">
            <Maximize2 />
            Expand
          </Button>
        </div>
      </section>
      <dialog
        id="screenshotDialog"
        className="screenshot-dialog"
        aria-labelledby="screenshotTitle"
      >
        <div className="screenshot-dialog-heading">
          <h2 id="screenshotTitle">ChatGPT</h2>
          <Button
            id="screenshotClose"
            variant="outline"
            size="icon"
            aria-label="Close screenshot"
          >
            <X />
          </Button>
        </div>
        <img
          id="screenshotImage"
          src="assets/previews/chatgpt-chatsweeper-deleting.png"
          alt="ChatSweeper showing deleted, deleting and protected chats on ChatGPT"
          width="1920"
          height="1200"
        />
      </dialog>
      <AboutDialog />
    </main>
  );
}
export const startMarkup = renderToStaticMarkup(<Start />);
