//
//  ViewController.swift
//  SmartWords
//
//  Created by Joey Jia on 12/7/25.
//

import UIKit
import WebKit
import Speech
import AVFoundation

class ViewController: UIViewController, WKNavigationDelegate, WKScriptMessageHandler, SFSpeechRecognizerDelegate {
    var webView: WKWebView!
    let candidateURLs: [String] = [
        // "https://joeychia.github.io/Smartwords-Input-Method/", // Production (Update this!)
        "http://10.0.0.131:5173",  // Mac's local IP - use this for physical device
        "http://localhost:5173",     // Works for Simulator only
        "http://127.0.0.1:5173"
    ]
    
    // Speech Recognition Properties
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Setup speech recognizer delegate
        speechRecognizer?.delegate = self
        
        let config = WKWebViewConfiguration()
        let controller = WKUserContentController()
        controller.add(self, name: "vimHandler")
        controller.add(self, name: "speechHandler")  // New handler for speech commands
        config.userContentController = controller
        webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = self
        webView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(webView)

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        loadServer()
        requestSpeechAuthorization()
    }

    func loadServer() {
        for urlString in candidateURLs {
            if let url = URL(string: urlString) {
                print("📡 Attempting to load: \(urlString)")
                webView.load(URLRequest(url: url))
                return
            }
        }
        print("❌ No valid URLs found in candidateURLs")
    }
    
    // MARK: - Speech Recognition Authorization
    
    private func requestSpeechAuthorization() {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            DispatchQueue.main.async {
                switch authStatus {
                case .authorized:
                    print("✅ Speech recognition authorized")
                case .denied:
                    print("❌ Speech recognition denied")
                case .restricted:
                    print("❌ Speech recognition restricted")
                case .notDetermined:
                    print("⚠️ Speech recognition not determined")
                @unknown default:
                    print("❌ Unknown authorization status")
                }
            }
        }
    }
    
    // MARK: - Speech Recognition Methods
    
    private func startRecording(language: String = "en-US") throws {
        // Cancel any ongoing task
        recognitionTask?.cancel()
        recognitionTask = nil
        
        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        // Use .playAndRecord for better compatibility with foreground transitions
        try audioSession.setCategory(.playAndRecord, mode: .measurement, options: [.duckOthers, .defaultToSpeaker])
        
        // Single activation attempt without blocking the main thread
        // If it fails here, the React layer will retry via the increased 1.5s delay
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        print("✅ Audio Session activated")
        
        // Create recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest = recognitionRequest else {
            throw NSError(domain: "SpeechRecognition", code: -1, userInfo: [NSLocalizedDescriptionKey: "Unable to create recognition request"])
        }
        
        recognitionRequest.shouldReportPartialResults = true
        
        // Get audio input node
        let inputNode = audioEngine.inputNode
        
        // Create recognizer for specified language
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: language)) ?? speechRecognizer
        
        // Start recognition task
        recognitionTask = recognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self = self else { return }
            
            var isFinal = false
            
            if let result = result {
                let transcript = result.bestTranscription.formattedString
                isFinal = result.isFinal
                
                // Send result back to React
                let jsCode = """
                if (window.handleSpeechResult) {
                    window.handleSpeechResult({
                        transcript: "\(transcript.replacingOccurrences(of: "\"", with: "\\\""))",
                        isFinal: \(isFinal)
                    });
                }
                """
                self.webView.evaluateJavaScript(jsCode, completionHandler: nil)
                
                print("🎤 Speech: \(transcript) (final: \(isFinal))")
            }
            
            if error != nil || isFinal {
                self.audioEngine.stop()
                inputNode.removeTap(onBus: 0)
                self.recognitionRequest = nil
                self.recognitionTask = nil
                
                if let error = error {
                    print("❌ Speech recognition error: \(error.localizedDescription)")
                }
            }
        }
        
        // Configure audio input
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            recognitionRequest.append(buffer)
        }
        
        // Start audio engine
        audioEngine.prepare()
        try audioEngine.start()
        
        print("✅ Speech recognition started")
    }
    
    private func stopRecording() {
        audioEngine.stop()
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        
        if let inputNode = audioEngine.inputNode as? AVAudioInputNode {
            inputNode.removeTap(onBus: 0)
        }
        
        print("⏹️ Speech recognition stopped")
    }

    // MARK: - WKScriptMessageHandler
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        if message.name == "vimHandler" {
            if let body = message.body as? [String: Any], let action = body["action"] as? String {
                if action == "saveToAppGroup", let text = body["text"] as? String {
                    DataManager.shared.savePendingText(text)
                }
            }
        } else if message.name == "speechHandler" {
            if let body = message.body as? [String: Any], let action = body["action"] as? String {
                if action == "start" {
                    let language = body["language"] as? String ?? "en-US"
                    do {
                        try startRecording(language: language)
                        // Notify React that recording started
                        webView.evaluateJavaScript("if (window.handleSpeechStarted) { window.handleSpeechStarted(); }", completionHandler: nil)
                    } catch {
                        print("❌ Failed to start recording: \(error.localizedDescription)")
                        let jsCode = """
                        if (window.handleSpeechError) {
                            window.handleSpeechError("\(error.localizedDescription)");
                        }
                        """
                        webView.evaluateJavaScript(jsCode, completionHandler: nil)
                    }
                } else if action == "stop" {
                    stopRecording()
                }
            }
        }
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        let label = UILabel()
        label.text = "Failed to load dev server"
        label.textAlignment = .center
        label.textColor = .secondaryLabel
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        print("WKWebView error:", error.localizedDescription)
    }

}
