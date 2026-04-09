# Qwen Code

## Autopilot mode

Qwen Code includes a 3-phase autopilot system that turns a rough idea into working code with no manual steps.

### Install skills (one-time setup)

```bash
npx antigravity-awesome-skills --path ~/.qwen/skills
```

### Usage

```bash
# Start brainstorm mode
autocreator --brainstorm

# Pre-seed with an idea
autocreator -b "build a CLI task manager in TypeScript"
```

Or from inside a running session:

```
/brainstorm
```

### How it works

1. **Brainstorm** — Chat about your idea. The agent asks focused questions.
2. Type **"go"** or **"start"** to trigger planning.
3. **Plan** — Skills are selected from `~/.qwen/skills/`, a task graph is built and previewed.
4. **Autopilot** — All tasks execute sequentially with no further input from you.

### Settings (~/.qwen/settings.json)

```json
{
  "autopilot": {
    "skillsPath": "~/.qwen/skills",
    "maxTaskRetries": 2,
    "planPreviewSeconds": 3,
    "goTriggers": ["go", "start", "execute", "run it"]
  }
}
```
