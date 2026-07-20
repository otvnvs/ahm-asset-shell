#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
ADB=/mnt/c/usr/bin/adb.exe
TARGET_PRIVATE_DIR="/data/user/0/$APP_PACKAGE/files"

# Intermediate staging area natively readable by the unprivileged app user
LOCAL_TMP_DIR="/data/local/tmp/MyHybridMobileStaging"

echo "---------------------------------------------------"
echo "Streaming project directly to private sandbox..."
echo "---------------------------------------------------"

# 1. Clear out and rebuild the local temporary staging area on the device
echo "Preparing temporary staging area on device..."
$ADB shell "rm -rf '$LOCAL_TMP_DIR' && mkdir -p '$LOCAL_TMP_DIR/www'"

# 2. Dynamically collect root elements excluding hidden dotfiles and node_modules
ITEMS_TO_PUSH=()
for item in *; do
    if [ "$item" != "node_modules" ] && [ "$item" != "samples" ] && [ -e "$item" ]; then
        ITEMS_TO_PUSH+=("$item")
    fi
done

# Check if we have anything to push
if [ ${#ITEMS_TO_PUSH[@]} -eq 0 ]; then
    echo "Error: No matching local files or folders found to transfer!"
    exit 1
fi

# 3. Use ADB push to deploy the files cleanly to our wide-open staging folder
echo "Pushing workspace assets to intermediate staging ground..."
for item in "${ITEMS_TO_PUSH[@]}"; do
    if [ -f "$item" ]; then
        $ADB push "$item" "$LOCAL_TMP_DIR/www/$item" > /dev/null
    elif [ -d "$item" ]; then
        $ADB push "$item" "$LOCAL_TMP_DIR/www/$item" > /dev/null 2>&1
    fi
done

# 4. Enforce global access rules on our temporary staging area so run-as can read it
echo "Opening staging permissions for application context..."
$ADB shell "chmod -R 777 '$LOCAL_TMP_DIR'"

# 5. Clean, prepare, and copy the assets straight into the secure sandbox
echo "Deploying from staging ground directly into secure sandbox..."
$ADB shell "run-as $APP_PACKAGE mkdir -p files"
$ADB shell "run-as $APP_PACKAGE rm -rf files/www"
$ADB shell "run-as $APP_PACKAGE cp -r '$LOCAL_TMP_DIR/www' files/"

# 6. Purge the global temporary folder to avoid cluttering up device space
echo "Cleaning up temporary staging data..."
$ADB shell "rm -rf '$LOCAL_TMP_DIR'"

# 7. Correct permissions inside the private folder to guarantee WebView readability
echo "Enforcing read/write permissions on sandbox assets..."
$ADB shell "run-as $APP_PACKAGE chmod -R 777 files/www"

# 8. Signal the active WebView layer to execute a live reload interface transition
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Direct Sandbox Sync Complete!"
echo "---------------------------------------------------"

