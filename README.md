# Smart Words Input Method

A hybrid iOS Input Method combining a React-based Main App (for AI processing) and a Native Swift Keyboard Extension.

## Architecture

1.  **React Main App**: Handles Speech-to-Text (Web Speech API), Gemini AI rewriting, and UI.
2.  **Native iOS Host**: Wraps the React App in a WKWebView and bridges data to the App Group.
3.  **Keyboard Extension**: A lightweight Swift extension that reads processed text from the App Group and inserts it into any text field.

---

## Prerequisites

*   **macOS** with **Xcode 15+** installed.
*   **Node.js** & **npm** (for the React app).
*   An Apple Developer Account (Free or Paid) to sign the App Group capabilities.

---

## Step 1: Prepare the React App

The iOS app needs to load your React application. You have two options:
1.  **Development**: Run the React app locally (`npm start`) and point the iOS WebView to `http://localhost:3000`.
2.  **Production**: Build the React app (`npm run build`) and bundle the static files into the Xcode project.

For this guide, we assume **Option 1 (Localhost)** for rapid testing.

1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Start the development server:
    ```bash
    npm start
    ```
    *Ensure the app is accessible at `http://localhost:3000`.*

---

## Step 2: Create the iOS Project

1.  Open **Xcode**.
2.  Select **Create New Project...** -> **iOS** -> **App**.
3.  **Product Name**: `SmartWords`.
4.  **Interface**: Storyboard.
5.  **Language**: Swift.
6.  Save it in a folder named `ios` inside your project root (or anywhere you prefer).

### Configure App Groups (Crucial)
Both the App and the Keyboard need to share data.
1.  Select the **SmartWords** target in Project Settings.
2.  Go to **Signing & Capabilities**.
3.  Click **+ Capability** and add **App Groups**.
4.  Click **+** under App Groups to create a new group.
    *   Format: `group.com.yourname.smartwords` (Replace `yourname` with your actual identifier).
    *   **Copy this ID**, you will need it later.

### Configure URL Scheme
1.  In the **SmartWords** target -> **Info** tab.
2.  Expand **URL Types**.
3.  Click **+**.
4.  **Identifier**: `com.yourname.smartwords`.
5.  **URL Schemes**: `smartwords`.

---

## Step 3: Add the Keyboard Extension

1.  In Xcode, go to **File** -> **New** -> **Target...**.
2.  Select **iOS** -> **Custom Keyboard Extension**.
3.  **Product Name**: `SmartWordsKeyboard`.
4.  Click **Finish**. Activate the scheme if asked.

### Configure Extension Capabilities
1.  Select the **SmartWordsKeyboard** target.
2.  Go to **Signing & Capabilities**.
3.  Add **App Groups**.
4.  **Check the box** for the SAME group ID you created in Step 2 (`group.com.yourname.smartwords`).

### Allow Full Access
1.  Open `SmartWordsKeyboard/Info.plist`.
2.  Find `NSExtension` -> `NSExtensionAttributes`.
3.  Add or Update Key: `RequestsOpenAccess` -> Boolean: `YES` (True).
    *   *Required to access shared App Group data.*

---

## Step 4: Integrate Code

Copy the provided Swift files into your Xcode project.

### 1. Shared Data Manager
1.  Create a new Swift file named `DataManager.swift` in Xcode.
2.  **Target Membership**: In the File Inspector (Right Panel), ensure **BOTH** `SmartWords` and `SmartWordsKeyboard` are checked.
3.  Paste the content from `ios/Shared/DataManager.swift`.
4.  **IMPORTANT**: Edit the `suiteName` variable in `DataManager.swift` to match your actual App Group ID (e.g., `group.com.yourname.smartwords`).

### 2. Main App View Controller
1.  Open `ViewController.swift` in the `SmartWords` folder.
2.  Paste the content from `ios/VoiceFlow/ViewController.swift`.
3.  Ensure the URL in `viewDidLoad` matches your React server (`http://localhost:3000` or your machine's local IP if testing on a physical device).
    *   *Note: If using Simulator, localhost works. If using a real iPhone, use your Mac's IP address (e.g., 192.168.1.5:3000).*

### 3. Keyboard View Controller
1.  Open `KeyboardViewController.swift` in the `SmartWordsKeyboard` folder.
2.  Paste the content from `ios/VIMKeyboard/KeyboardViewController.swift`.
3.  **IMPORTANT**: In `KeyboardViewController.swift`, update the `openMainApp` function to use the new URL scheme: `smartwords://dictate`.

---

## Step 5: Validate on Simulator

### 1. Run the Main App
1.  Select the **SmartWords** scheme in Xcode.
2.  Select an **iPhone Simulator** (e.g., iPhone 15 Pro).
3.  Click **Run (Play button)**.
4.  The app should open and display your React UI.
5.  **Grant Microphone Permissions** if prompted.

### 2. Enable the Keyboard
1.  On the Simulator, go to **Settings** -> **General** -> **Keyboard** -> **Keyboards**.
2.  Tap **Add New Keyboard...**.
3.  Select **SmartWords** under "Third-Party Keyboards".
4.  Tap **SmartWords - SmartWordsKeyboard**.
5.  **Toggle "Allow Full Access"** -> **Allow**.

### 3. Test the Flow
1.  Open **Notes** or **Messages** on the Simulator.
2.  Tap the text field to bring up the keyboard.
3.  Long-press the **Globe Icon** (or bottom-left icon) and select **SmartWords**.
4.  You should see the Native "🎤 Smart Words" button (You may need to update the button title in Swift).
5.  **Tap the Button**:
    *   It should switch to the **Smart Words Main App**.
6.  **Dictate**:
    *   Tap the Mic in the React App.
    *   Speak (or simulate audio).
    *   Wait for AI Rewrite options.
    *   **Select a variant**.
    *   You should see a "Saved" toast notification.
7.  **Return**:
    *   Manually switch back to the **Notes App** (swipe up or double-tap Home).
8.  **Insert**:
    *   The keyboard should detect the saved text and **automatically type it out**.

---

## Troubleshooting

*   **"App Group not found"**: Double-check that the Group ID in `DataManager.swift` matches exactly what is checked in "Signing & Capabilities" for BOTH targets.
*   **Bridge not working**: Open Safari on your Mac -> Develop -> Simulator -> [Your Device] -> JS Context. Check the Console for `[Bridge]` logs.
*   **Keyboard not inserting**: Ensure "Allow Full Access" is ON in iOS Settings.
