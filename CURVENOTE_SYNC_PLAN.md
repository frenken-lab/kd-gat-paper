# Linking the Repo ↔ Curvenote Editor

Sources read (verified against curvenote@0.14.x source code, not just
docs):

- `curvenote/curvenote/packages/curvenote-cli/src/session/session.ts`
  → `CONFIG_FILES = ['curvenote.yml', 'myst.yml']` (curvenote CLI reads
  either; `curvenote.yml` takes precedence if present)
- `curvenote/curvenote/packages/curvenote-cli/src/sync/clone.ts`
  → `clone` writes a project config with `remote: <id>` and `id: <id>`
  pointing to a curvenote.com project, then runs `pullProject`
- `curvenote/curvenote/packages/curvenote-cli/src/works/push.ts`
  → `work push` uploads MyST content to curvenote.com using
  `project.id` ("work key") from config; creates new work or new
  version
- `curvenote/curvenote/packages/curvenote/src/sync.ts` and `works.ts`
  → top-level CLI commands: `init`, `clone`, `pull`, `work list`,
  `work push`

## How the link actually works

The bind between local repo and a curvenote.com project is a single
field in the project config (`myst.yml`'s `project:` block, or
`curvenote.yml` if it exists):

```yaml
project:
  id: <curvenote-project-id>
  remote: <curvenote-project-id>   # written by clone, optional after
```

That's the entire link. Any folder with `myst.yml` containing this id
becomes "the local mirror" of that curvenote.com project. The CLI
finds it by walking up the directory tree.

## Three CLI verbs that move bytes

| Command | Direction | Effect | Destructive? |
|---|---|---|---|
| `curvenote pull [path]` | curvenote.com → local | Overwrite local files with remote content | **Yes** — wipes uncommitted local changes |
| `curvenote work push` | local → curvenote.com | Upload local MyST as new "work" version | No (server-side; creates version, doesn't overwrite history) |
| `curvenote deploy` | local → `*.curve.space` | Publish to the public hosted site | No (the public site is generated, not authored) |

**No merge.** No diff. No conflict resolution. The flow expects you to
serialize: pick one side as the active editor for any given period,
then push or pull when you switch.

## Authentication

```bash
# get a token from curvenote.com → profile → API tokens
curvenote token set <token>            # stores locally
# OR
export CURVENOTE_TOKEN=<token>         # CI / one-shot use
```

## Setup recipes

### Recipe A — repo is the source, push to a new curvenote.com project

You want to keep authoring locally as today, but mirror the candidacy
build to curvenote.com so you (or a co-author) can read/edit it in
the web editor and pull edits back.

```bash
# 1. Auth (one-time per machine)
curvenote token set <token>

# 2. From repo root, with the candidacy config active:
cp myst.yml myst.yml.paper
cp myst.candidacy.yml myst.yml
trap 'mv myst.yml.paper myst.yml' EXIT

# 3. Push as a new Work on curvenote.com.
#    First run: prompts for a work key (project.id), writes it into myst.yml.
#    Subsequent runs: create a new version of the same work.
curvenote work push

# 4. The CLI prints a curvenote.com URL. Open it; you're in the editor.

# 5. To bring editor edits back later:
curvenote pull paper/candidacy/        # or whatever subpath was linked
# (DANGER: overwrites that path. Commit or stash first.)
```

After step 3, `myst.candidacy.yml` (now copied to `myst.yml`) has a
`project.id` field. **Commit that change** to `myst.candidacy.yml`
specifically, not the swapped `myst.yml`, so the link survives the CI
swap dance.

### Recipe B — start from an existing curvenote.com project

You already created a project on curvenote.com (via the web UI) and
want to link it into the repo as a sub-folder.

```bash
# 1. Auth as above.

# 2. Clone the project into a sub-folder. This:
#    - creates the folder
#    - pulls all articles + images
#    - writes a myst.yml inside that folder with id/remote set
#    - if a root myst.yml exists, adds the folder to site.projects + nav
curvenote clone https://curvenote.com/@<user>/<project> paper/from-editor/

# 3. Edit on curvenote.com → pull back:
curvenote pull paper/from-editor/

# 4. Edit locally → push back:
curvenote work push           # from inside paper/from-editor/, uses local myst.yml
```

### Recipe C — interactive bootstrap (good for first-time setup)

```bash
curvenote init --curvenote https://curvenote.com/@<user>/<project>
# Walks through: target folder, project metadata, optionally start dev server.
# Equivalent to clone + extra prompts.
```

## What needs to happen in this repo to enable Recipe A

1. **Decide the link target**: which file's `project.id` should hold
   the curvenote.com binding? Recommended: `myst.candidacy.yml` (the
   candidacy is what curve.space publishes, and it's the only one
   with extended content meant for editor review).
2. **Make `make sync` work**:
   ```makefile
   sync:
       cp myst.yml myst.yml.paper
       cp myst.candidacy.yml myst.yml
       trap 'mv myst.yml.paper myst.yml' EXIT; \
       bunx -y curvenote@0.14.3 pull --yes
   ```
   Mirrors the CI deploy swap so the right config is active during
   pull.
3. **First-run authoring step** (one-time, manual on a dev machine,
   not CI):
   ```bash
   cd ~/kd-gat-paper
   cp myst.yml myst.yml.paper && cp myst.candidacy.yml myst.yml
   bunx curvenote@0.14.3 work push
   # Note the work URL. The command writes project.id into myst.yml.
   # Move that key into myst.candidacy.yml, restore myst.yml from .paper.
   git add myst.candidacy.yml && git commit -m "link candidacy to curvenote.com work <url>"
   mv myst.yml.paper myst.yml
   ```
4. **Document the workflow** in CLAUDE.md so subsequent edits know to
   `curvenote work push` after local changes if they want them
   visible in the editor.

## Caveats

- The OSC login node we're on doesn't have `bun` in PATH; CI uses bun
  via setup-bun. Run these commands on the WSL dev machine where bun
  is installed (per `~/CLAUDE.md` machine notes). Or `npx
  curvenote@0.14.3 ...` should also work via the npm package.
- `curvenote pull` overwriting local files is real. Always commit or
  stash before pulling. Consider keeping linked content in a dedicated
  sub-folder so a botched pull can't damage `paper/content/`.
- The "work" model on curvenote.com creates versioned snapshots; it's
  not clear from the source whether editing a work in the web UI
  produces a new version automatically or whether the editor surface
  for a pushed work is read-only. **Verify by pushing a test work
  first** before assuming round-trip editing works.
- We have no `curvenote.yml`. Curvenote CLI will fall back to
  `myst.yml`. Keep it that way unless `curvenote work push` writes a
  `curvenote.yml` we need to commit.

## Open questions to resolve during setup

1. Does `work push` produce an editable surface in the web UI, or just
   a published-snapshot view? (Test in Recipe A step 3-4.)
2. Where does `work push` write the `project.id` — into the active
   `myst.yml` or into a new `curvenote.yml`? (Watch git diff after the
   first push.)
3. Does `curvenote pull` work on a work-pushed project, or only on
   projects created via the web UI? (Test by editing on curvenote.com
   then running `curvenote pull`.)

## Action items

- [ ] Get a curvenote API token from curvenote.com → profile.
- [ ] On WSL dev machine, run Recipe A steps 1-3 and capture the
      output in a session log.
- [ ] Commit the resulting `project.id` to `myst.candidacy.yml`.
- [ ] Update `Makefile`'s `sync` target to do the candidacy-yml swap
      so `make sync` does what it claims.
- [ ] Add a one-paragraph "Editor sync" section to CLAUDE.md
      describing the push/pull workflow and the destructive nature of
      pull.
