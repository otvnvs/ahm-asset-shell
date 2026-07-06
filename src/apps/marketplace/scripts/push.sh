#!/bin/bash
set -e

# --- CONFIGURATION ---
APP_PACKAGE="com.example.app"
TARGET_BASE_DIR="/sdcard/Documents/MyHybridMobile/www/src/apps"
ADB="/mnt/c/usr/bin/adb.exe"
[ ! -f "$ADB" ] && ADB="adb"

# 1. Parse the application name from app.json
if [ ! -f "./app.json" ]; then
    echo "Error: app.json not found in the current directory."
    exit 1
fi

# Extract value inside quotes after "name":
CURRENT_DIRECTORY_NAME=$(grep '"name":' app.json | sed -E 's/.*"name"[[:space:]]*:[[:space:]]*"([^"]+)".*/\1/')

if [ -z "$CURRENT_DIRECTORY_NAME" ]; then
    echo "Error: Could not parse 'name' field from app.json."
    exit 1
fi

echo "---------------------------------------------------"
echo "Target app directory (from app.json): $CURRENT_DIRECTORY_NAME"
echo "---------------------------------------------------"

# 2. Pack the entire contents of the current directory locally
echo "Packing current directory assets..."
rm -f ./assets_temp.tar
tar --exclude='./assets_temp.tar' -cf ./assets_temp.tar .

# 3. Clear out and recreate the specific target path on the device
echo "Clearing and preparing remote directory..."
$ADB shell "rm -rf '$TARGET_BASE_DIR/$CURRENT_DIRECTORY_NAME' && mkdir -p '$TARGET_BASE_DIR/$CURRENT_DIRECTORY_NAME'"

# 4. Push the archive to the staging base
echo "Pushing archive to device..."
$ADB push ./assets_temp.tar "/sdcard/Documents/MyHybridMobile/assets_temp.tar" > /dev/null
rm -f ./assets_temp.tar

# 5. Extract archive directly into the specific subfolder, then clear archive
echo "Extracting assets on device..."
$ADB shell "tar -xf '/sdcard/Documents/MyHybridMobile/assets_temp.tar' -C '$TARGET_BASE_DIR/$CURRENT_DIRECTORY_NAME/' && rm '/sdcard/Documents/MyHybridMobile/assets_temp.tar'"

# 6. Securely copy the whole ecosystem into the sandbox
echo "Deploying to secure sandbox..."
$ADB shell "run-as $APP_PACKAGE rm -rf files/www"
$ADB shell "run-as $APP_PACKAGE mkdir -p files/www"
$ADB shell "run-as $APP_PACKAGE cp -r /sdcard/Documents/MyHybridMobile/www/. files/www/"

# 7. Fix runtime ownership permissions inside the sandbox
echo "Optimising sandbox permissions..."
$ADB shell "run-as $APP_PACKAGE chmod -R 755 files/www"

# 8. Force reload
echo "Sending reload broadcast to WebView layer..."
$ADB shell am broadcast -a "$APP_PACKAGE.ACTION_RELOAD_WEBVIEW" > /dev/null

echo "---------------------------------------------------"
echo "Sync Complete! '$CURRENT_DIRECTORY_NAME' updated."
echo "---------------------------------------------------"

