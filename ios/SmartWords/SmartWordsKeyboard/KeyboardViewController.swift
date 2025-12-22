//
//  KeyboardViewController.swift
//  SmartWordsKeyboard
//
//  Created by Joey Jia on 12/7/25.
//

import UIKit
import SwiftUI

class KeyboardViewController: UIInputViewController {
    private let insertButton = UIButton(type: .system)
    private let nextKeyboardButton = UIButton(type: .system)
    
    // SwiftUI Hosting Controller for the Link
    private var openAppLinkHost: UIHostingController<OpenAppLink>?

    override func viewDidLoad() {
        super.viewDidLoad()

        view.backgroundColor = UIColor(white: 0.95, alpha: 1.0)
        
        // Initially hide until we confirm needsInputModeSwitchKey in viewDidAppear
        nextKeyboardButton.isHidden = true

        insertButton.setTitle("Insert", for: .normal)
        insertButton.titleLabel?.font = UIFont.systemFont(ofSize: 16, weight: .semibold)
        insertButton.translatesAutoresizingMaskIntoConstraints = false
        insertButton.addTarget(self, action: #selector(handleInsert), for: .touchUpInside)

        // Setup SwiftUI Link
        let linkView = OpenAppLink()
        let host = UIHostingController(rootView: linkView)
        self.openAppLinkHost = host
        
        addChild(host)
        host.view.translatesAutoresizingMaskIntoConstraints = false
        host.view.backgroundColor = .clear // Blend in
        
        // We need to add the host view to our hierarchy
        // We'll put it in the stack view where the old button was
        
        nextKeyboardButton.setTitle("🌐", for: .normal)
        nextKeyboardButton.titleLabel?.font = UIFont.systemFont(ofSize: 20)
        nextKeyboardButton.translatesAutoresizingMaskIntoConstraints = false
        nextKeyboardButton.addTarget(self, action: #selector(handleInputModeList(from:with:)), for: .allTouchEvents)
        
        // Stack View now contains the hosting controller's view instead of the UIButton
        let stack = UIStackView(arrangedSubviews: [host.view, insertButton])
        stack.axis = .horizontal
        stack.spacing = 16
        stack.alignment = .center // Important for mixing UIView and HostingController
        stack.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(stack)
        view.addSubview(nextKeyboardButton)
        
        host.didMove(toParent: self)

        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            
            // Give the SwiftUI view a reasonable frame inside the stack if needed, 
            // generally intrinsic content size handles it, but let's send it.

            nextKeyboardButton.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            nextKeyboardButton.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -8)
        ])
    }

    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
    }

    @objc private func handleInsert() { insertPendingIfAvailable() }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        
        print("SmartWordsKeyboard: viewDidAppear")
        
        // Defer checks slightly to ensure connection is fully established
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
            guard let self = self else { return }
            
            print("SmartWordsKeyboard: Checking permissions and configuration...")
            
            // Update nextKeyboardButton visibility safely
            self.nextKeyboardButton.isHidden = !self.needsInputModeSwitchKey
            
            // Log Full Access status for debugging purposes
            if self.hasFullAccess {
                print("SmartWordsKeyboard: Full Access is ENABLED")
            } else {
                print("SmartWordsKeyboard: Full Access is DISABLED.")
            }
            
            self.insertPendingIfAvailable()
        }
    }

    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        insertPendingIfAvailable()
    }

    private func insertPendingIfAvailable() {
        if let text = DataManager.shared.getPendingText(), text.isEmpty == false {
            textDocumentProxy.insertText(text)
            DataManager.shared.clearPendingText()
        }
    }
}
