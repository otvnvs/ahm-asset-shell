#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
TARGET_DIR="/sdcard/Documents/MyHybridMobile"
ADB=/mnt/c/usr/bin/adb.exe

# Target directories and root files from the first script
FOLDERS_TO_PUSH=("src" "public" "dist" "lib")
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
echo "Instantly syncing web assets via public staging ground..."
echo "---------------------------------------------------"

# 1. Reset and recreate target staging directories on the Android device
echo "Preparing staging directories on device..."
$ADB shell "rm -rf '$TARGET_DIR' && mkdir -p '$TARGET_DIR/www'"

# 2. Push verified root level files to the public staging area
echo "Pushing root configuration files to staging..."
for file in "${ROOT_FILES[@]}"; do
    if [ -f "$file" ]; then
        $ADB push "$file" "$TARGET_DIR/www/$file" > /dev/null
    else
        echo "Skipping optional file: $file"
    fi
done

# 3. Push required source and asset directories to the public staging area
echo "Pushing target directories (src, public, dist, lib) to staging..."
for folder in "${FOLDERS_TO_PUSH[@]}"; do
  if [ -d "$folder" ]; then
    echo "Pushing $folder to $TARGET_DIR/www/$folder..."
    # Redirect stderr to /dev/null to keep execution clean and quiet
    $ADB push "$folder" "$TARGET_DIR/www/$folder" > /dev/null 2>&1
  else
    echo "Skipping $folder (Directory does not exist locally)"
  fi
done

# 4. Deploy everything from the external staging ground directly into the secure app sandbox
echo "Deploying from staging ground to secure sandbox..."
$ADB shell "run-as $APP_PACKAGE rm -rf files/www"
$ADB shell "run-as $APP_PACKAGE cp -r $TARGET_DIR/www files/"

# 5. Signal the active WebView layer to execute a live reload interface transition
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Sync Complete! Source assets updated via public staging."
echo "---------------------------------------------------"

