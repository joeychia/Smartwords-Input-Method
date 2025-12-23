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
    private let devURL = "http://10.0.0.131:5173"
    private let prodURL = "https://joeychia.github.io/Smartwords-Input-Method/"
    private var activityIndicator: UIActivityIndicatorView?

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

    private func setupLoadingIndicator() {
        let indicator = UIActivityIndicatorView(style: .medium)
        indicator.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(indicator)
        NSLayoutConstraint.activate([
            indicator.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            indicator.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
        indicator.startAnimating()
        self.activityIndicator = indicator
    }

    func loadServer() {
        let pref = DataManager.shared.getEnvironmentPreference()
        print("🔍 Preferred Environment: \(pref)")
        
        switch pref {
        case "dev":
            loadURL(devURL)
        case "prod":
            loadURL(prodURL)
        default: // auto
            setupLoadingIndicator()
            checkEndpoint(devURL) { [weak self] isAvailable in
                DispatchQueue.main.async {
                    self?.activityIndicator?.stopAnimating()
                    self?.activityIndicator?.removeFromSuperview()
                    
                    let finalURL = isAvailable ? self?.devURL : self?.prodURL
                    print("🏁 Auto-environment check complete. Loading: \(finalURL ?? "nil")")
                    
                    if let urlString = finalURL {
                        self?.loadURL(urlString)
                    }
                }
            }
        }
    }

    private func loadURL(_ urlString: String) {
        guard let url = URL(string: urlString) else { return }
        print("🚀 Loading URL: \(urlString)")
        let request = URLRequest(url: url, cachePolicy: .useProtocolCachePolicy, timeoutInterval: 30.0)
        webView.load(request)
    }

    private func checkEndpoint(_ urlString: String, completion: @escaping (Bool) -> Void) {
        guard let url = URL(string: urlString) else {
            completion(false)
            return
        }
        
        print("🔍 Probing environment: \(urlString)")
        var request = URLRequest(url: url)
        request.httpMethod = "HEAD"
        request.timeoutInterval = 1.0 // Quick probe
        
        let task = URLSession.shared.dataTask(with: request) { _, response, error in
            if let error = error {
                print("❌ Probe failed: \(error.localizedDescription)")
                completion(false)
            } else {
                print("✅ Probe success")
                completion(true)
            }
        }
        task.resume()
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
        try audioSession.setActive(true, options: .notifyingOthersOnDeactivation)
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
                } else if action == "setEnvironmentPreference", let pref = body["preference"] as? String {
                    print("⚙️ Setting environment preference to: \(pref)")
                    DataManager.shared.setEnvironmentPreference(pref)
                    
                    // Immediately reload with the new environment
                    DispatchQueue.main.async {
                        self.loadServer()
                    }
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
        handleLoadFailure(error: error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        handleLoadFailure(error: error)
    }

    private func handleLoadFailure(error: Error) {
        print("❌ Final Webview load failed: \(error.localizedDescription)")
        showFailureUI()
    }

    private func showFailureUI() {
        let label = UILabel()
        label.text = "Failed to load Smart Words"
        label.textAlignment = .center
        label.textColor = .secondaryLabel
        label.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(label)
        NSLayoutConstraint.activate([
            label.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            label.centerYAnchor.constraint(equalTo: view.centerYAnchor)
        ])
    }


}
