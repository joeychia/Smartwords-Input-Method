import SwiftUI

// Keyboard mode enum
enum KeyboardMode {
    case letters
    case symbols
    case extendedSymbols
}

// Protocol to handle keyboard actions back in the ViewController
protocol KeyboardActionDelegate: AnyObject {
    func insertText(_ text: String)
    func deleteBackward()
    func returnKeyPressed()
    func globeKeyPressed()
    func insertPendingText()
}

struct KeyboardView: View {
    weak var delegate: KeyboardActionDelegate?
    
    @State private var keyboardMode: KeyboardMode = .symbols
    @State private var isShifted: Bool = false
    
    var body: some View {
        VStack(spacing: 8) {
            // -- Row 1: Top Bar (Settings | Start App) --
            HStack {
                // Settings link to open app at settings screen
                Link(destination: URL(string: "smartwords://setting")!) {
                    Image(systemName: "slider.horizontal.3")
                        .font(.system(size: 24))
                        .foregroundColor(.white)
                        .overlay(alignment: .topTrailing) {
                            Circle()
                                .fill(Color.red)
                                .frame(width: 8, height: 8)
                                .offset(x: 2, y: -2)
                        }
                }
                .padding(.leading, 12)
                
                Spacer()
                
                // Native Link wrapper to open the app
                Link(destination: URL(string: "smartwords://dictate")!) {
                    Text("Start SmartWords")
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(.black)
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(Color.white)
                        .cornerRadius(20)
                }
                .padding(.trailing, 12)
            }
            .padding(.top, 8)
            .padding(.bottom, 4)
            
            // Conditional layout based on mode
            if keyboardMode == .letters {
                letterLayout
            } else if keyboardMode == .symbols {
                symbolLayout
            } else {
                extendedSymbolsLayout
            }
        }
        .padding(.bottom, 8)
        .background(Color(red: 0.1, green: 0.1, blue: 0.1))
    }
    
    // MARK: - Letter Layout (QWERTY)
    
    var letterLayout: some View {
        VStack(spacing: 6) {
            // Row 1: Q W E R T Y U I O P
            HStack(spacing: 6) {
                ForEach(["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"], id: \.self) { key in
                    KeyboardKey(text: isShifted ? key : key.lowercased(), action: {
                        delegate?.insertText(isShifted ? key : key.lowercased())
                        if isShifted { isShifted = false }
                    })
                }
            }
            .padding(.horizontal, 4)
            
            // Row 2: A S D F G H J K L (centered)
            HStack(spacing: 6) {
                Spacer().frame(width: 20)
                ForEach(["A", "S", "D", "F", "G", "H", "J", "K", "L"], id: \.self) { key in
                    KeyboardKey(text: isShifted ? key : key.lowercased(), action: {
                        delegate?.insertText(isShifted ? key : key.lowercased())
                        if isShifted { isShifted = false }
                    })
                }
                Spacer().frame(width: 20)
            }
            .padding(.horizontal, 4)
            
            // Row 3: Shift + Z X C V B N M + Backspace
            HStack(spacing: 6) {
                KeyboardKey(
                    icon: isShifted ? "shift.fill" : "shift",
                    color: isShifted ? Color.white.opacity(0.3) : Color(white: 0.3),
                    width: 1.5,
                    action: { isShifted.toggle() }
                )
                ForEach(["Z", "X", "C", "V", "B", "N", "M"], id: \.self) { key in
                    KeyboardKey(text: isShifted ? key : key.lowercased(), action: {
                        delegate?.insertText(isShifted ? key : key.lowercased())
                        if isShifted { isShifted = false }
                    })
                }
                KeyboardKey(icon: "delete.left", color: Color(white: 0.3), width: 1.5, action: { delegate?.deleteBackward() })
            }
            .padding(.horizontal, 4)
            
            // Row 4: 123 | Space | Return
            HStack(spacing: 6) {
                KeyboardKey(text: "123", color: Color(white: 0.3), width: 2.0, action: {
                    keyboardMode = .symbols
                })
                
                Button(action: {
                    delegate?.insertText(" ")
                }) {
                    Text("SmartWords")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color(white: 0.25))
                        .cornerRadius(5)
                }
                
                KeyboardKey(icon: "return", color: Color(white: 0.3), width: 2.0, action: { delegate?.returnKeyPressed() })
            }
            .padding(.horizontal, 4)
        }
    }
    
    // MARK: - Symbol Layout (Numbers + Symbols)
    
    var symbolLayout: some View {
        VStack(spacing: 6) {
            // Row 1: Numbers
            HStack(spacing: 6) {
                ForEach(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
            }
            .padding(.horizontal, 4)
            
            // Row 2: Symbols
            HStack(spacing: 6) {
                ForEach(["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
            }
            .padding(.horizontal, 4)
            
            // Row 3: #+= + punctuation + backspace
            HStack(spacing: 6) {
                KeyboardKey(text: "#+=", color: Color(white: 0.3), width: 1.3, action: {
                    keyboardMode = .extendedSymbols
                })
                KeyboardKey(text: ".", action: { delegate?.insertText(".") })
                KeyboardKey(text: ",", action: { delegate?.insertText(",") })
                KeyboardKey(text: "?", action: { delegate?.insertText("?") })
                KeyboardKey(text: "!", action: { delegate?.insertText("!") })
                KeyboardKey(text: "'", action: { delegate?.insertText("'") })
                KeyboardKey(icon: "delete.left", color: Color(white: 0.3), width: 1.3, action: { delegate?.deleteBackward() })
            }
            .padding(.horizontal, 4)
            
            // Row 4: ABC | Space | Return
            HStack(spacing: 6) {
                KeyboardKey(text: "ABC", color: Color(white: 0.3), width: 2.0, action: {
                    keyboardMode = .letters
                })
                
                Button(action: {
                    delegate?.insertText(" ")
                }) {
                    Text("SmartWords")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color(white: 0.25))
                        .cornerRadius(5)
                }
                
                KeyboardKey(icon: "return", color: Color(white: 0.3), width: 2.5, action: { delegate?.returnKeyPressed() })
            }
            .padding(.horizontal, 4)
        }
    }
    
    // MARK: - Extended Symbols Layout
    
    var extendedSymbolsLayout: some View {
        VStack(spacing: 6) {
            // Row 1: Brackets and special symbols
            HStack(spacing: 6) {
                ForEach(["[", "]", "{", "}", "#", "%", "^", "*", "+", "="], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
            }
            .padding(.horizontal, 4)
            
            // Row 2: More symbols
            HStack(spacing: 6) {
                ForEach(["_", "\\", "|", "~", "<", ">", "€", "£", "¥", "•"], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
            }
            .padding(.horizontal, 4)
            
            // Row 3: 123 + punctuation + backspace
            HStack(spacing: 6) {
                KeyboardKey(text: "123", color: Color(white: 0.3), width: 1.3, action: {
                    keyboardMode = .symbols
                })
                KeyboardKey(text: ".", action: { delegate?.insertText(".") })
                KeyboardKey(text: ",", action: { delegate?.insertText(",") })
                KeyboardKey(text: "?", action: { delegate?.insertText("?") })
                KeyboardKey(text: "!", action: { delegate?.insertText("!") })
                KeyboardKey(text: "'", action: { delegate?.insertText("'") })
                KeyboardKey(icon: "delete.left", color: Color(white: 0.3), width: 1.3, action: { delegate?.deleteBackward() })
            }
            .padding(.horizontal, 4)
            
            // Row 4: ABC | Space | Return
            HStack(spacing: 6) {
                KeyboardKey(text: "ABC", color: Color(white: 0.3), width: 2.0, action: {
                    keyboardMode = .letters
                })
                
                Button(action: {
                    delegate?.insertText(" ")
                }) {
                    Text("SmartWords")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.gray)
                        .frame(maxWidth: .infinity)
                        .frame(height: 44)
                        .background(Color(white: 0.25))
                        .cornerRadius(5)
                }
                
                KeyboardKey(icon: "return", color: Color(white: 0.3), width: 2.5, action: { delegate?.returnKeyPressed() })
            }
            .padding(.horizontal, 4)
        }
    }
}

// Reusable Key Component
struct KeyboardKey: View {
    var text: String?
    var icon: String?
    var color: Color = Color(white: 0.25)
    var width: CGFloat = 1.0
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack {
                if let text = text {
                    Text(text)
                        .font(.system(size: text.count > 1 ? 14 : 20, weight: text.count > 1 ? .semibold : .regular))
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                }
            }
            .frame(maxWidth: .infinity)
            .frame(height: 44)
            .background(color)
            .foregroundColor(.white)
            .cornerRadius(5)
        }
    }
}
