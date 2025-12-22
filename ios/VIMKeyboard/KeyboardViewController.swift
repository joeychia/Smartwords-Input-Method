import UIKit

class KeyboardViewController: UIInputViewController {
    private let insertButton = UIButton(type: .system)

    override func viewDidLoad() {
        super.viewDidLoad()

        insertButton.setTitle("🎤 Smart Words", for: .normal)
        insertButton.addTarget(self, action: #selector(handleInsert), for: .touchUpInside)
        insertButton.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(insertButton)

        NSLayoutConstraint.activate([
            insertButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            insertButton.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }

    @objc private func handleInsert() {
        if let text = DataManager.shared.getPendingText(), text.isEmpty == false {
            let proxy = textDocumentProxy
            proxy.insertText(text)
            DataManager.shared.clearPendingText()
        } else {
            openMainApp()
        }
    }

    private func openMainApp() {
        guard let url = URL(string: "smartwords://dictate") else { return }
        let selector = NSSelectorFromString("openURL:")
        if UIApplication.shared.responds(to: selector) {
            UIApplication.shared.perform(selector, with: url)
        }
    }
}
