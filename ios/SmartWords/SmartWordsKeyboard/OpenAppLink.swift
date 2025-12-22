import SwiftUI

struct OpenAppLink: View {
    var body: some View {
        Link(destination: URL(string: "smartwords://dictate")!) {
            Text("Open App")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(Color.blue)
                .cornerRadius(8)
        }
    }
}
