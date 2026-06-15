FROM node:22-bookworm

# Install common dev tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Install Jumbo CLI (from local build — mount or copy during image build)
# For now, install placeholder — real path configured at build time
ARG JUMBO_CLI_PATH=""
RUN if [ -n "$JUMBO_CLI_PATH" ]; then npm install -g "$JUMBO_CLI_PATH"; fi

# Workspace directory
RUN mkdir -p /workspace
WORKDIR /workspace

# API keys come from environment variables at runtime — never baked into the image
# See invariant: inv_a8c50a2b - No API keys in source code, config files, or test fixtures

# Keep container running for exec commands
CMD ["tail", "-f", "/dev/null"]
