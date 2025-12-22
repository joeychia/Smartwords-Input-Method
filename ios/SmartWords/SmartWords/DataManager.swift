import Foundation
import UIKit

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
        UIPasteboard.general.string = text
    }

    func getPendingText() -> String? {
        if let v = defaults.string(forKey: keyPending) { return v }
        return UIPasteboard.general.string
    }

    func clearPendingText() {
        defaults.removeObject(forKey: keyPending)
    }
}
