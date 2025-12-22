//
//  KeyboardViewController.swift
//  SmartWordsKeyboard
//
//  Created by Joey Jia on 12/7/25.
//

import UIKit
import SwiftUI

class KeyboardViewController: UIInputViewController {
    
    // SwiftUI Hosting Controller
    private var keyboardHostingController: UIHostingController<KeyboardView>?

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Remove default view background to let SwiftUI handle it
        view.backgroundColor = .clear
        
        // Setup SwiftUI View with self as delegate
        let keyboardView = KeyboardView(delegate: self)
        let host = UIHostingController(rootView: keyboardView)
        self.keyboardHostingController = host
        
        // Add hosting controller as child
        addChild(host)
        view.addSubview(host.view)
        host.didMove(toParent: self)
        
        // Layout Config
        host.view.translatesAutoresizingMaskIntoConstraints = false
        host.view.backgroundColor = .clear
        
        NSLayoutConstraint.activate([
            host.view.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.view.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.view.topAnchor.constraint(equalTo: view.topAnchor),
            host.view.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }
    
    override func viewWillLayoutSubviews() {
        super.viewWillLayoutSubviews()
    }
    
    // Global Pending Text Logic
    override func textDidChange(_ textInput: UITextInput?) {
        super.textDidChange(textInput)
        // Check for pending text from the main app (e.g. after dictation)
        if let text = DataManager.shared.getPendingText(), !text.isEmpty {
            textDocumentProxy.insertText(text)
            DataManager.shared.clearPendingText()
        }
    }
}

// MARK: - Keyboard Action Delegate
extension KeyboardViewController: KeyboardActionDelegate {
    
    func insertText(_ text: String) {
        textDocumentProxy.insertText(text)
    }
    
    func deleteBackward() {
        textDocumentProxy.deleteBackward()
    }
    
    func returnKeyPressed() {
        textDocumentProxy.insertText("\n")
    }
    
    func globeKeyPressed() {
        // Globe button removed from UI, keeping method for protocol compliance or future use
        self.advanceToNextInputMode()
    }
    
    func insertPendingText() {
        if let text = DataManager.shared.getPendingText(), !text.isEmpty {
            textDocumentProxy.insertText(text)
            DataManager.shared.clearPendingText()
        } else {
            // Optional: visual feedback if nothing to insert?
            // For now, silent failure is standard behavior
        }
    }
}
