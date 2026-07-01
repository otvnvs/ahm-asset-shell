#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
TARGET_DIR="/sdcard/Documents/MyHybridMobile"
ADB=/mnt/c/usr/bin/adb.exe
FOLDERS_TO_PUSH=("src" "public" "dist" "lib")

# Define exactly which root files are required by your app setup
ROOT_FILES=(
    "index.html"
    "index.sfc.html"
    "index.vite.html"
    "error.html"
    "package.json"
    "vite.config.js"
    "serve.sh"
    "README.md"
    "a.txt"
)

echo "---------------------------------------------------"
echo "Instantly syncing web assets via dedicated ADB channels..."
echo "---------------------------------------------------"

# Clean up local leftovers
rm -f ./assets_temp.tar

# 1. Force clear and create the main workspace directory tree synchronously
echo "Preparing staging directories on device..."
$ADB shell "rm -rf '$TARGET_DIR' && mkdir -p '$TARGET_DIR/www'"

# 2. Channel 1: Push verified root level files only
echo "Pushing root configuration files..."
for file in "${ROOT_FILES[@]}"; do
    if [ -f "$file" ]; then
        $ADB push "$file" "$TARGET_DIR/www/$file" > /dev/null
    else
        echo "Skipping optional file: $file"
    fi
done

# 3. Channel 2: Push required source and asset directories directly
echo "Pushing target directories (src, public, dist)..."
# Array of directories we want to synchronize with the Android device

for folder in "${FOLDERS_TO_PUSH[@]}"; do
  if [ -d "$folder" ]; then
    echo "Pushing $folder to $TARGET_DIR/www/$folder..."
    # Redirect stderr to /dev/null to hide warning output, ensure it remains quiet
    $ADB push "$folder" "$TARGET_DIR/www/$folder" > /dev/null 2>&1
  else
    echo "Skipping $folder (Directory does not exist locally)"
  fi
done

# 4. Securely copy everything into the sandbox
echo "Deploying to secure sandbox..."
$ADB shell "run-as $APP_PACKAGE rm -rf files/www"
$ADB shell "run-as $APP_PACKAGE cp -r $TARGET_DIR/www files/"

# 5. Force reload
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Sync Complete! Assets updated in real-time."
echo "---------------------------------------------------"

