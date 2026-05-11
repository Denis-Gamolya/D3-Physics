name: Deploy to itch.io

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read

    env:
      FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true
      ITCH_USER: ${{ vars.ITCH_USER }}
      ITCH_GAME: ${{ vars.ITCH_GAME }}
      ITCH_CHANNEL: ${{ vars.ITCH_CHANNEL || 'html5' }}
      BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}
      USER_VERSION: ${{ github.sha }}

    steps:
      - name: Check out repository
        uses: actions/checkout@v6

      - name: Validate itch.io settings
        run: |
          test -n "$ITCH_USER" || (echo "Missing repo variable ITCH_USER" && exit 1)
          test -n "$ITCH_GAME" || (echo "Missing repo variable ITCH_GAME" && exit 1)
          test -n "$BUTLER_API_KEY" || (echo "Missing secret BUTLER_API_KEY" && exit 1)
          echo "Deploy target: ${ITCH_USER}/${ITCH_GAME}:${ITCH_CHANNEL}"

      - name: Install butler
        run: |
          curl -L -o butler.zip https://broth.itch.zone/butler/linux-amd64/LATEST/archive/default
          unzip -q butler.zip -d butler
          chmod +x butler/butler
          butler/butler -V

      - name: Build web release
        run: bash scripts/build-web.sh

      - name: Deploy to itch.io
        run: |
          $PWD/butler/butler status
          $PWD/butler/butler push dist "${ITCH_USER}/${ITCH_GAME}:${ITCH_CHANNEL}" --userversion "${USER_VERSION::7}" --if-changed