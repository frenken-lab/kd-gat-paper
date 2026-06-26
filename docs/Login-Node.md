# OSC Login Node: Resources & Interactive Jobs

## Resource impact of `quarto preview`

`quarto preview` is acceptable on a login node — it idles on file watches and only
spikes briefly on `.qmd` saves.

| Resource | Impact | Notes |
|---|---|---|
| CPU | Near-zero while idle | Brief spike on file-change rebuild |
| Memory | Moderate | Quarto process + project cache; shared login-node RAM |
| SSH tunnel | Negligible | Just a channel in sshd |

Running `make build` alongside `quarto preview` on the login node is borderline —
move to a compute node if you need both simultaneously.

## Running two dev servers simultaneously

Example: paper site (`quarto preview`) + colloquium slides (static server, port 8080).

**Terminal layout — all tabs in VS Code:**

```
LOCAL (VS Code WSL terminal)
├── Tab 1  ssh -L 3000:localhost:3000 -L 8080:localhost:8080 rf15@pitzer-login01.hpc.osc.edu
│          └── now an OSC shell → run: cd ~/kd-gat-paper && make dev
└── Tab 2  ssh rf15@pitzer-login01.hpc.osc.edu
           └── OSC shell → run slides watcher + static server (see below)

Browser (local): forwarded Quarto URL = paper   localhost:8080/candidacy.html = slides
```

Tab 1 does double duty: the `-L` flags establish both port forwards while the shell
itself runs `make dev`. Tab 2 is a plain second SSH session for the slides process.

**Tab 2 commands (OSC):**

```bash
cd ~/kd-gat-paper
make slides-dev    # colloquium serve — watches + rebuilds + serves on port 8080
```

`Ctrl+C` stops it. No `entr` or separate static server needed — colloquium's built-in
`serve` command handles file watching, rebuild, and HTTP serving in one process.

> **General rule:** one blocking process per terminal tab. Each `quarto preview`,
> `http.server`, or `entr` loop needs its own tab (or a tmux pane if you prefer
> to keep all OSC work in a single SSH session).

## Getting a compute node (`salloc`)

```bash
salloc -N 1 -n 4 --time=2:00:00 --account=PAS2022
```

Drops you into a shell on a compute node. Run builds normally from there; `exit` releases it.

Check available accounts: `sacctmgr show user $USER withassoc format=account`

## SSH tunnel to a compute node

Once on a compute node, `quarto preview` won't be reachable via the standard login-node
tunnel. Set up a two-hop forward from your local machine instead:

```bash
# Check your node name first: echo $HOSTNAME (e.g. p0123)
ssh -J rf15@pitzer-login01.hpc.osc.edu -L 3000:p0123:3000 rf15@p0123
```

Or equivalently in `~/.ssh/config`:

```
Host pitzer-compute
    HostName p0123           # replace after salloc
    User rf15
    ProxyJump pitzer-login01.hpc.osc.edu
```

Then: `ssh -L 3000:localhost:3000 pitzer-compute`

Start the dev server on the compute node and open `http://localhost:3000` locally as usual.
