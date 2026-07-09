#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
ADB=/mnt/c/usr/bin/adb.exe
TARGET_PRIVATE_DIR="/data/user/0/$APP_PACKAGE/files"

# Define target directories and root files from the first script
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
echo "Streaming source assets directly to private sandbox..."
echo "---------------------------------------------------"

# 1. Dynamically build the list of files/folders that actually exist locally
ITEMS_TO_TAR=()

for file in "${ROOT_FILES[@]}"; do
    if [ -f "$file" ]; then
        ITEMS_TO_TAR+=("$file")
    fi
done

for folder in "${FOLDERS_TO_PUSH[@]}"; do
    if [ -d "$folder" ]; then
        ITEMS_TO_TAR+=("$folder")
    fi
done

# Check if we have anything to push
if [ ${#ITEMS_TO_TAR[@]} -eq 0 ]; then
    echo "Error: No matching local files or folders found to transfer!"
    exit 1
fi

# 2. Re-create the www folder directly inside the private app partition
echo "Cleaning and preparing private target directory..."
$ADB shell "run-as $APP_PACKAGE rm -rf files/www && run-as $APP_PACKAGE mkdir -p files/www"

# 3. Stream filtered assets through ADB exec-in and unpack them inside the secure partition
echo "Streaming selected source files straight into $TARGET_PRIVATE_DIR/www/..."
# We pass the dynamically generated list of existing files and folders straight into tar
tar -cC . "${ITEMS_TO_TAR[@]}" | $ADB exec-in "run-as $APP_PACKAGE tar -xC files/www"

# 4. Correct permissions inside the private folder to guarantee WebView readability
echo "Enforcing read/write permissions on sandbox assets..."
$ADB shell "run-as $APP_PACKAGE chmod -R 777 files/www"

# 5. Signal the active WebView layer to execute a live reload interface transition
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Direct Source Sandbox Sync Complete!"
echo "---------------------------------------------------"

