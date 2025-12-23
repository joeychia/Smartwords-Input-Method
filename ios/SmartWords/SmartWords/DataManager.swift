import Foundation

final class DataManager {
    static let shared = DataManager()
    private init() {}

    private let suiteName = "group.com.joeyjia.smartwords"
    private let keyPending = "pending_text"
    private let keyEnvPreference = "app_environment_preference"

    private var defaults: UserDefaults {
        UserDefaults(suiteName: suiteName) ?? UserDefaults.standard
    }

    func savePendingText(_ text: String) {
        defaults.set(text, forKey: keyPending)
        defaults.synchronize()
    }

    func setEnvironmentPreference(_ pref: String) {
        defaults.set(pref, forKey: keyEnvPreference)
        defaults.synchronize()
    }

    func getEnvironmentPreference() -> String {
        return defaults.string(forKey: keyEnvPreference) ?? "auto"
    }

    func getPendingText() -> String? {
        return defaults.string(forKey: keyPending)
    }

    func clearPendingText() {
        defaults.removeObject(forKey: keyPending)
    }
}
