import Foundation

final class DataManager {
    static let shared = DataManager()
    private init() {}

    private let suiteName = "group.com.joeyjia.smartwords"
    private let keyPending = "pending_text"

    private var defaults: UserDefaults {
        UserDefaults(suiteName: suiteName) ?? UserDefaults.standard
    }

    func savePendingText(_ text: String) {
        defaults.set(text, forKey: keyPending)
        defaults.synchronize()
        // Removed UIPasteboard usage to prevent "Allow Pasting" popups
    }

    func getPendingText() -> String? {
        return defaults.string(forKey: keyPending)
    }

    func clearPendingText() {
        defaults.removeObject(forKey: keyPending)
    }
}
