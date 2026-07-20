#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
TARGET_DIR="/sdcard/Documents/MyHybridMobile"
ADB=/mnt/c/usr/bin/adb.exe

# Target ground in a globally readable temporary path natively supported by run-as
LOCAL_TMP_DIR="/data/local/tmp/MyHybridMobileStaging"

echo "---------------------------------------------------"
echo "Instantly syncing Vue project via reliable file streams..."
echo "---------------------------------------------------"

# 1. Clear out and rebuild the local temporary staging areas on the device
echo "Preparing global staging areas on device..."
$ADB shell "rm -rf '$LOCAL_TMP_DIR' && mkdir -p '$LOCAL_TMP_DIR/www'"
$ADB shell "rm -rf '$TARGET_DIR' && mkdir -p '$TARGET_DIR/www'"

# 2. Collect root elements excluding hidden dotfiles and node_modules
ITEMS_TO_PUSH=()
for item in *; do
    if [ "$item" != "node_modules" ] && [ "$item" != "samples" ] && [ -e "$item" ]; then
        ITEMS_TO_PUSH+=("$item")
    fi
done

# 3. Use ADB push to deploy the files cleanly to our wide-open staging folder
echo "Pushing workspace assets to high-privilege staging ground..."
for item in "${ITEMS_TO_PUSH[@]}"; do
    if [ -f "$item" ]; then
        $ADB push "$item" "$LOCAL_TMP_DIR/www/$item" > /dev/null
    elif [ -d "$item" ]; then
        $ADB push "$item" "$LOCAL_TMP_DIR/www/$item" > /dev/null 2>&1
    fi
done

# 4. Enforce global access rules on our temporary staging area 
echo "Opening staging permissions for application context..."
$ADB shell "chmod -R 777 '$LOCAL_TMP_DIR'"

# 5. Safely copy the clean assets into the sandbox using the native shell 'cp' utility
echo "Deploying from staging ground to secure sandbox..."
$ADB shell "run-as $APP_PACKAGE mkdir -p files"
$ADB shell "run-as $APP_PACKAGE rm -rf files/www"
$ADB shell "run-as $APP_PACKAGE cp -r '$LOCAL_TMP_DIR/www' files/"

# 6. Safely mirror the clean assets into your public SDCard workspace
echo "Mirroring clean assets out to public SDCard..."
$ADB shell "cp -r '$LOCAL_TMP_DIR/www/.' '$TARGET_DIR/www/'"

# 7. Purge the global temporary folder to avoid cluttering up device space
echo "Cleaning up temporary staging data..."
$ADB shell "rm -rf '$LOCAL_TMP_DIR'"

# 8. Signal the active WebView layer to execute a live reload interface transition
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Sync Complete! Target workspace assets populated successfully."
echo "---------------------------------------------------"

