import SwiftUI

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
    
    // The "Start SmartWords" link action is handled via the native Link component
    // But we might want to style it specifically.
    
    var body: some View {
        VStack(spacing: 8) {
            // -- Row 1: Top Bar (Settings | Start App) --
            HStack {
                Button(action: {
                    // Placeholder for settings
                }) {
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
            
            // -- Row 2: Numbers --
            HStack(spacing: 6) {
                ForEach(["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
            }
            .padding(.horizontal, 4)
            
            // -- Row 3: Symbols 1 --
            HStack(spacing: 6) {
                ForEach(["-", "/", ":", ";", "(", ")", "$", "&", "@", "\""], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
            }
            .padding(.horizontal, 4)
            
            // -- Row 4: Symbols 2 + Backspace --
            HStack(spacing: 6) {
                KeyboardKey(text: "#+=", color: Color(white: 0.3), width: 1.5, action: { /* Switch Mode? */ })
                ForEach([".", ",", "?", "!", "'"], id: \.self) { key in
                    KeyboardKey(text: key, action: { delegate?.insertText(key) })
                }
                KeyboardKey(icon: "delete.left", color: Color(white: 0.3), width: 1.2, action: { delegate?.deleteBackward() })
            }
            .padding(.horizontal, 4)
            
            // -- Row 5: Action Row --
            HStack(spacing: 6) {
                // CHANGED: "ABC" -> "Insert" with action
                KeyboardKey(text: "Insert", color: Color(white: 0.3), width: 1.5, action: { delegate?.insertPendingText() })
                
                // Main "SmartWords" Space/Action Bar
                Button(action: {
                    delegate?.insertText(" ")
                }) {
                    HStack {
                        Image(systemName: "chart.bar.xaxis") // Closest icon to '|||'
                        Text("SmartWords")
                            .font(.system(size: 18, weight: .bold))
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 44)
                    .background(Color(white: 0.3)) // Dark Grey
                    .foregroundColor(.gray)
                    .cornerRadius(5)
                }
                
                KeyboardKey(icon: "return", color: Color(white: 0.3), width: 1.5, action: { delegate?.returnKeyPressed() })
            }
            .padding(.horizontal, 4)
            
            // REMOVED: Row 6 (Globe Icon)
        }
        .padding(.bottom, 8) // Add some bottom padding since we removed the row
        .background(Color(red: 0.1, green: 0.1, blue: 0.1)) // Dark Background
    }
}

// Reusable Key Component
struct KeyboardKey: View {
    var text: String?
    var icon: String?
    var color: Color = Color(white: 0.25)
    var width: CGFloat = 1.0 // Relative width multiplier
    var action: () -> Void
    
    var body: some View {
        Button(action: action) {
            ZStack {
                if let text = text {
                    // Adjust font size for longer text like "Insert"
                    Text(text)
                        .font(.system(size: text.count > 1 ? 14 : 20, weight: text.count > 1 ? .semibold : .regular))
                } else if let icon = icon {
                    Image(systemName: icon)
                        .font(.system(size: 20))
                }
            }
            .frame(maxWidth: .infinity) // Flexible width
            .frame(height: 44)
            .background(color)
            .foregroundColor(.white)
            .cornerRadius(5)
        }
        // Apply width multiplier logic if strictly needed, but flexible Grid/HStack often better
        // For simple rows, just letting them expand equally is close enough for v1
    }
}
