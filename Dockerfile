FROM node:22-alpine

# Installing PNPM
RUN wget -qO- https://get.pnpm.io/install.sh \
    | ENV="$HOME/.shrc" SHELL="$(which sh)" sh - \
    && export PNPM_HOME='$HOME/.local/share/pnpm' \
    && export PATH="$PNPM_HOME:$PATH" \
    && ln -s "$HOME/.local/share/pnpm/pnpm" /usr/local/bin/pnpm

COPY . /app

WORKDIR /app

# Install dependencies
RUN pnpm install && pnpm run build

CMD ["pnpm", "run", "preview"]