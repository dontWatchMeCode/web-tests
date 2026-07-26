# Web Tests

A small TypeScript command-line toolkit for checking and downloading websites.

## Features

- **SSL checks**: inspect certificate validity and remaining lifetime for multiple hosts.
- **Link crawling**: recursively check links, retry failures, and group results by HTTP status.
- **Offline mirrors**: recursively download a site and selected related domains while preserving the site structure.
- **File-based configuration**: keep reusable target lists and options in local `.conf` files.

## Requirements

- Node.js 16 or newer
- npm
- Network access to the target websites

Run all commands from the repository root. Configuration and output paths are relative to it.

## Installation

```bash
git clone https://github.com/OnlyPain-ctrl/web-tests.git
cd web-tests
npm ci
```

Create the configuration files for the tools you want to use:

```bash
cp settings/examples/ssl.conf settings/ssl.conf
cp settings/examples/crawl.conf settings/crawl.conf
cp settings/examples/offline.conf settings/offline.conf
```

The files in `settings/` and all generated output are ignored by Git.

## SSL Certificate Checks

Edit `settings/ssl.conf`:

```conf
_MODE: table
_LOGGING: true

https://example.com
www.example.org/
example.net
```

Options:

| Setting | Values | Description |
| --- | --- | --- |
| `_MODE` | `table`, `json` | Selects the terminal output format. |
| `_LOGGING` | `true`, `false` | Saves results to `_logs/ssl.json` when enabled. |

Use one host or HTTPS URL per line. The tool removes a lowercase `https://` prefix and one trailing slash, then checks port 443. Duplicate entries are checked once.

Run the check:

```bash
npm run ssl
```

Each result contains the source host, error state, certificate validity, validity dates, remaining days, and covered hostnames when available. If logging is enabled and the log is missing or invalid, the command asks before creating or replacing it.

## Recursive Link Checks

Edit `settings/crawl.conf`:

```conf
_CONCURRENCY: 5
_FULL: true
_SKIPEXTERNAL: true
_SKIPFILES: true
_TIMEOUT: 1

https://example.com
```

Options:

| Setting | Values | Description |
| --- | --- | --- |
| `_CONCURRENCY` | Integer | Maximum concurrent requests per root URL. |
| `_FULL` | `true`, `false` | Also writes a complete result file for each root. |
| `_SKIPEXTERNAL` | `true`, `false` | Skips links that do not contain the configured root URL. This is a substring check, not a hostname check. |
| `_SKIPFILES` | `true`, `false` | Skips URLs matching the built-in file-extension list, which includes `.html`. Set this to `false` when those pages must be crawled. |
| `_TIMEOUT` | Integer | Request timeout in minutes. |

Add one fully qualified root URL per line. Multiple roots are crawled at the same time, each with its own concurrency limit.

Run the crawler:

```bash
npm run crawl
```

The crawler:

- follows links recursively;
- prints each status and URL while running;
- retries request errors twice;
- always writes pipe-delimited `.csv` files grouped by status class;
- writes an additional `[full]` file when `_FULL` is enabled;
- writes combined non-200 files when multiple roots are configured.

Results are saved under:

```text
_logs/crawler/<day>/<time>/
```

Each row has this structure and no header:

```text
state|status|url|parent
```

## Offline Website Mirrors

Edit `settings/offline.conf`:

```conf
_CONCURRENCY: 20

---

https://www.example.com
* https://static.example.com
* https://cdn.example.net

---

https://docs.example.com
* https://assets.example.com
```

Options and syntax:

- `_CONCURRENCY` controls concurrent download requests.
- Separate website groups with `---`.
- The first URL in each group is the starting page.
- Prefix additional allowed URLs or domains with `*`.
- The starting URL is automatically part of its group's allowlist.

Run the mirror:

```bash
npm run offline
```

The command recursively downloads allowed URLs, preserves their site structure, and sends a mobile browser user agent. Output is intended for `_offline_version/<day>/<time>/`, but the current timestamp defect described below affects every run.

### Current Offline Limitations

- The npm script uses POSIX shell syntax (`export`), so it does not run unchanged in Windows Command Prompt or PowerShell.
- The current output-directory code references the time formatter without calling it, so the generated directory name contains the formatter's function text instead of a timestamp.
- Downloads are started asynchronously without being awaited by the top-level command, so completion and failures are not reliably reported.
- Multiple configured groups write to the same output directory and may overwrite colliding paths.

## Configuration Rules

- Lines beginning with `#` are comments.
- Setting names begin with `_` and use `NAME: value` syntax.
- Do not remove required settings; missing values currently cause the command to fail during config parsing.
- Boolean values must be lowercase `true` or `false`.

## Output Directories

| Tool | Output |
| --- | --- |
| SSL | `_logs/ssl.json` when logging is enabled |
| Crawler | `_logs/crawler/<day>/<time>/` |
| Offline mirror | `_offline_version/<day>/<time>/` (subject to the limitation above) |

## Security Warning

The CLI currently sets `NODE_TLS_REJECT_UNAUTHORIZED=0` for every command. This disables Node.js TLS certificate verification for requests made by the process. Run the toolkit only in an environment where this behavior is acceptable, and do not treat successful requests as proof that a server's certificate chain is trusted.

## Development

The project runs TypeScript directly through `ts-node`; there is no separate build step.

Type-check the project:

```bash
npx tsc --noEmit
```

Run ESLint:

```bash
npx eslint . --ext .ts
```

There is currently no automated test suite or deployment workflow.

## Troubleshooting

### Configuration file not found

Copy the matching example from `settings/examples/` into `settings/`, then run the command again from the repository root.

### SSL log prompt appears

With `_LOGGING: true`, the tool prompts when `_logs/ssl.json` does not exist or contains invalid JSON. Enter `y` to create or replace the file, or `n` to continue without writing it.

### Crawler skips an expected page

Check `_SKIPEXTERNAL` and `_SKIPFILES`. External detection uses a root-URL substring match rather than a hostname comparison, and the built-in file list includes `.html`, so `_SKIPFILES: true` can exclude some pages.

## License

ISC
